
import pRetry, { AbortError } from 'p-retry';
import type {
  TranscriptionResult,
  LectureNotes,
  AIConfig,
  TranscriptionOptions,
  SummarizationOptions,
} from '@/types';
import {
  TRANSLATE_PROMPTS,
  FORMAT_PROMPTS,
  buildSummarizationPrompt,
} from '@/lib/ai-prompts';
import {
  retryOptions,
  createOpenAIClient,
  cropToTokenLimit,
  addBasicParagraphs,
  chunkText,
  paceTokens,
} from '@/lib/ai-utils';
import { prepareAudioChunks } from '@/lib/ffmpeg';
import { promises as fsp } from 'fs';
import {
  transcribeWithOpenAI,
  transcribeWithGroq,
  transcribeWithDeepgram,
} from '@/lib/transcription-providers';

export { buildSummarizationPrompt } from '@/lib/ai-prompts';

// Groq's free tier has a shared input/output token limit.
const GROQ_MAX_INPUT_TOKENS = 4000;
const GROQ_MAX_OUTPUT_TOKENS = 1500;
const GROQ_MAX_TRANSLATION_OUTPUT_TOKENS = 3000;
const GROQ_MAX_SUMMARY_OUTPUT_TOKENS = 2000;

// Per-chunk input size for translate/format/condense.
const GROQ_CHUNK_TOKENS = 2500;

/**
 * Get AI configuration for transcription.
 * Transcription and text generation can use different providers.
 */
export function getAIConfig(): AIConfig {
  const AI_PROVIDER =
    (process.env.AI_PROVIDER as
      | 'openai'
      | 'groq'
      | 'deepgram'
      | 'anthropic') || 'openai';

  switch (AI_PROVIDER) {
    case 'openai':
      return {
        provider: 'openai',
        transcriptionModel:
          process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel:
          process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.OPENAI_API_KEY || '',
      };

    case 'groq':
      return {
        provider: 'groq',
        transcriptionModel:
          process.env.GROQ_TRANSCRIPTION_MODEL || 'whisper-large-v3',
        summarizationModel:
          process.env.GROQ_SUMMARIZATION_MODEL || 'openai/gpt-oss-20b',
        apiKey: process.env.GROQ_API_KEY || '',
      };

    case 'deepgram':
      return {
        provider: 'deepgram',
        transcriptionModel: 'nova-2',
        summarizationModel:
          process.env.OPENAI_SUMMARIZATION_MODEL || 'gpt-4-turbo-preview',
        apiKey: process.env.DEEPGRAM_API_KEY || '',
      };

    case 'anthropic':
      return {
        provider: 'anthropic',
        transcriptionModel:
          process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
        summarizationModel:
          process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
      };

    default:
      throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }
}

/**
 * Get configuration for translation, formatting and summarization.
 */
export function getSummarizationConfig(): AIConfig {
  const SUMMARIZATION_PROVIDER =
    (process.env.AI_SUMMARIZATION_PROVIDER as
      | 'openai'
      | 'groq'
      | 'anthropic'
      | 'gemini') ||
    (process.env.AI_PROVIDER as
      | 'openai'
      | 'groq'
      | 'deepgram'
      | 'anthropic') ||
    'openai';

  if (SUMMARIZATION_PROVIDER === 'gemini') {
    return {
      provider: 'gemini',
      transcriptionModel: '',
      summarizationModel:
        process.env.GEMINI_SUMMARIZATION_MODEL || 'gemini-3.6-flash',
      apiKey: process.env.GEMINI_API_KEY || '',
    };
  }

  return getAIConfig();
}

/**
 * Transcribe an audio file using the configured provider.
 */
export async function transcribeAudio(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const config = getAIConfig();

  if (!config.apiKey) {
    throw new Error(
      `API key not configured for provider: ${config.provider}`
    );
  }

  switch (config.provider) {
    case 'openai':
    case 'anthropic':
      return transcribeWithOpenAI(audioPath, config, options);

    case 'groq':
      return transcribeWithGroq(audioPath, config, options);

    case 'deepgram':
      return transcribeWithDeepgram(audioPath, config, options);

    default:
      throw new Error(
        `Transcription not supported for provider: ${config.provider}`
      );
  }
}

/**
 * Transcribe long audio in sequential chunks.
 * The previous chunk's tail is used as context for continuity.
 */
export async function transcribeAudioChunked(
  audioPath: string,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const { chunks, dir } = await prepareAudioChunks(audioPath, 600);

  console.log(
    `[Transcription] Split into ${chunks.length} chunk(s)`
  );

  try {
    const texts: string[] = [];
    const segments: NonNullable<TranscriptionResult['segments']> = [];

    let duration = 0;
    let language: string | undefined;

    for (let i = 0; i < chunks.length; i++) {
      console.log(
        `[Transcription] Chunk ${i + 1}/${chunks.length}`
      );

      const tail = texts.length
        ? texts[texts.length - 1].slice(-200)
        : '';

      const result = await transcribeAudio(chunks[i].path, {
        ...options,
        prompt:
          [options.prompt, tail].filter(Boolean).join(' ').slice(-800) ||
          undefined,
      });

      texts.push(result.text.trim());
      duration += result.duration || 0;
      language = language || result.language;

      result.segments?.forEach((seg) =>
        segments.push({
          id: segments.length,
          start: seg.start + chunks[i].offsetSeconds,
          end: seg.end + chunks[i].offsetSeconds,
          text: seg.text,
        })
      );
    }

    return {
      text: texts.join('\n\n'),
      duration,
      language,
      ...(segments.length && { segments }),
    } as TranscriptionResult;
  } finally {
    await fsp.rm(dir, {
      recursive: true,
      force: true,
    }).catch(() => {});
  }
}

/**
 * Translate a transcript into the selected output language.
 * Supported languages: English, Urdu and Roman Urdu.
 */
export async function translateTranscript(
  transcript: string,
  targetLanguage: 'english' | 'urdu' | 'roman-urdu'
): Promise<string> {
  if (!transcript.trim()) {
    return transcript;
  }

  const config = getSummarizationConfig();

  if (!config.apiKey) {
    throw new Error(
      `API key not configured for provider: ${config.provider}`
    );
  }

  const languageLabels = {
    english: 'English',
    urdu: 'Urdu',
    'roman-urdu': 'Roman Urdu',
  } as const;

  const languageLabel = languageLabels[targetLanguage];

  console.log(
    `[Translation] Translating transcript to ${languageLabel}...`
  );

  if (
    config.provider !== 'openai' &&
    config.provider !== 'groq' &&
    config.provider !== 'gemini'
  ) {
    throw new Error(
      `Translation is not supported for provider: ${config.provider}`
    );
  }

  try {
    const openai = createOpenAIClient(config);
    const isGroq = config.provider === 'groq';

    const parts = isGroq
      ? chunkText(transcript, GROQ_CHUNK_TOKENS)
      : [transcript];

    const out: string[] = [];

    for (const part of parts) {
      if (isGroq) {
        await paceTokens(
          Math.ceil(part.length / 4) +
            GROQ_MAX_TRANSLATION_OUTPUT_TOKENS
        );
      }

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          {
            role: 'system',
            content: TRANSLATE_PROMPTS[targetLanguage],
          },
          {
            role: 'user',
            content: part,
          },
        ],
        temperature: 0.3,
        stream: false,
        ...(isGroq
          ? ({
              max_completion_tokens:
                GROQ_MAX_TRANSLATION_OUTPUT_TOKENS,
              include_reasoning: false,
              reasoning_effort: 'low',
            } as any)
          : {}),
      });

      const translatedText = response.choices[0]?.message?.content;

      if (!translatedText?.trim()) {
        console.error('[Translation] Empty response metadata:', {
          model: response.model,
          finishReason: response.choices[0]?.finish_reason,
          usage: response.usage,
          refusal: response.choices[0]?.message?.refusal,
        });

        throw new Error(
          `Translation provider returned an empty ${languageLabel} translation.`
        );
      }

      out.push(translatedText.trim());
    }

    console.log(
      `[Translation] Translation complete (${parts.length} part(s))`
    );

    return out.join('\n\n');
  } catch (error) {
    console.error('[Translation] Translation failed:', error);

    throw new Error(
      `Failed to translate transcript into ${languageLabel}. ${
        error instanceof Error
          ? error.message
          : 'Unknown translation error.'
      }`
    );
  }
}

/**
 * Format transcript into readable paragraphs and sections.
 * Supported output languages: English, Urdu and Roman Urdu.
 */
export async function formatTranscript(
  transcript: string,
  language: 'english' | 'urdu' | 'roman-urdu' = 'english'
): Promise<string> {
  if (!transcript.trim()) {
    return transcript;
  }

  const config = getSummarizationConfig();

  if (!config.apiKey) {
    return addBasicParagraphs(transcript);
  }

  try {
    const langKey: 'english' | 'urdu' | 'roman-urdu' = language;

    if (
      config.provider === 'openai' ||
      config.provider === 'groq' ||
      config.provider === 'gemini'
    ) {
      const openai = createOpenAIClient(config);
      const isGroq = config.provider === 'groq';

      const parts = isGroq
        ? chunkText(transcript, GROQ_CHUNK_TOKENS)
        : [transcript];

      const out: string[] = [];

      for (const part of parts) {
        if (isGroq) {
          await paceTokens(
            Math.ceil(part.length / 4) + GROQ_MAX_OUTPUT_TOKENS
          );
        }

        const response = await openai.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            {
              role: 'system',
              content: FORMAT_PROMPTS[langKey],
            },
            {
              role: 'user',
              content: part,
            },
          ],
          temperature: 0.2,
          ...(isGroq && {
            max_tokens: GROQ_MAX_OUTPUT_TOKENS,
          }),
        });

        out.push(response.choices[0].message.content || part);
      }

      return out.join('\n\n');
    }

    return addBasicParagraphs(transcript);
  } catch (error) {
    console.error('[Format] Formatting failed:', error);
    return addBasicParagraphs(transcript);
  }
}

/**
 * Generate structured lecture notes from a transcript.
 */
export async function summarizeTranscript(
  transcript: string,
  originalFilename: string,
  options: SummarizationOptions = {}
): Promise<LectureNotes> {
  const config = getSummarizationConfig();

  if (!config.apiKey) {
    throw new Error(
      `API key not configured for provider: ${config.provider}`
    );
  }

  const maxInputTokens =
    config.provider === 'groq' ? GROQ_MAX_INPUT_TOKENS : 100000;

  const estimatedTokens = Math.ceil(transcript.length / 4);

  console.log(
    `[Summarization] Estimated tokens: ${estimatedTokens}, Max: ${maxInputTokens}`
  );

  let processedTranscript = transcript;
  let wasCropped = false;

  if (estimatedTokens > maxInputTokens) {
    console.log(
      `[Summarization] Transcript too long (${estimatedTokens} tokens), condensing in chunks...`
    );

    const isGroq = config.provider === 'groq';
    const client = createOpenAIClient(config, {
      maxRetries: 0,
    });

    const parts = chunkText(
      transcript,
      isGroq ? GROQ_CHUNK_TOKENS : 30000
    );

    const digests: string[] = [];

    for (const part of parts) {
      if (isGroq) {
        await paceTokens(
          Math.ceil(part.length / 4) + 800
        );
      }

      const digest = await pRetry(async () => {
        const response = await client.chat.completions.create({
          model: config.summarizationModel,
          messages: [
            {
              role: 'system',
              content:
                'Condense this lecture transcript segment into dense bullet notes. Keep every key concept, definition, example, number and name. Same language as the input. No preamble.',
            },
            {
              role: 'user',
              content: part,
            },
          ],
          temperature: 0.2,
          max_tokens: 800,
        });

        return response.choices[0].message.content || '';
      }, retryOptions('Condense'));

      digests.push(digest);
    }

    processedTranscript = digests.join('\n\n');

    if (
      Math.ceil(processedTranscript.length / 4) >
      maxInputTokens
    ) {
      processedTranscript = cropToTokenLimit(
        processedTranscript,
        maxInputTokens
      );

      wasCropped = true;
    }
  }

  const systemPrompt = buildSummarizationPrompt(options);

  let summaryText: string;

  if (
    config.provider === 'openai' ||
    config.provider === 'groq' ||
    config.provider === 'gemini'
  ) {
    const openai = createOpenAIClient(config, {
      maxRetries: 0,
    });

    summaryText = await pRetry(async (attemptNumber) => {
      console.log(
        `[Summarization] Attempt ${attemptNumber}...`
      );

      if (config.provider === 'groq') {
        await paceTokens(
          Math.ceil(processedTranscript.length / 4) +
            GROQ_MAX_SUMMARY_OUTPUT_TOKENS
        );
      }

      const response = await openai.chat.completions.create({
        model: config.summarizationModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: processedTranscript,
          },
        ],
        temperature: 0.3,
        response_format: {
          type: 'json_object',
        },
        ...(config.provider === 'groq' && {
          max_tokens: GROQ_MAX_SUMMARY_OUTPUT_TOKENS,
        }),
      });

      return response.choices[0].message.content || '{}';
    }, retryOptions('Summarization'));
  } else if (config.provider === 'anthropic') {
    summaryText = await pRetry(async (attemptNumber) => {
      console.log(
        `[Anthropic Summarization] Attempt ${attemptNumber}...`
      );

      const response = await fetch(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: config.summarizationModel,
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: `${systemPrompt}\n\nTranscript:\n${processedTranscript}`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => response.statusText);

        if (
          response.status === 401 ||
          response.status === 400
        ) {
          throw new AbortError(
            `Anthropic API failed: ${errorText}`
          );
        }

        throw new Error(
          `Anthropic API failed: ${errorText}`
        );
      }

      const data = await response.json();

      return data.content[0].text;
    }, retryOptions('Anthropic'));
  } else {
    throw new Error(
      `Summarization not supported for provider: ${config.provider}`
    );
  }

  const parsed = JSON.parse(summaryText);

  let summary = parsed.summary || '';

  if (wasCropped) {
    summary =
      `⚠️ **Note**: Transcript was too long and was cropped to fit within API limits. Only the first ~${maxInputTokens} tokens were processed.\n\n${summary}`;
  }

  return {
    title: parsed.title || 'Untitled Lecture Notes',
    summary,
    paragraphs: parsed.paragraphs || [],
    bulletPoints: parsed.bulletPoints || [],
    keyConcepts: parsed.keyConcepts || [],
    definitions: parsed.definitions || [],
    exampleProblems: parsed.exampleProblems || [],
    quizQuestions: parsed.quizQuestions || [],
    actionItems: parsed.actionItems || [],
    metadata: {
      generatedAt: new Date().toISOString(),
      transcriptionModel: getAIConfig().transcriptionModel,
      summarizationModel: config.summarizationModel,
      originalFilename,
      wordCount: processedTranscript.split(/\s+/).length,
      ...(wasCropped && {
        note: 'Transcript was cropped due to API token limits',
      }),
    },
  };
}
