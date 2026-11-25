import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAIConfig,
  getSummarizationConfig,
  translateTranscript,
  formatTranscript,
  summarizeTranscript,
} from '@/lib/ai';
import { buildSummarizationPrompt, FORMAT_PROMPTS, TRANSLATE_PROMPTS } from '@/lib/ai-prompts';

const { mockCreate, mockTranscriptionsCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockTranscriptionsCreate: vi.fn(),
}));

vi.mock('@/lib/ai-utils', async (orig) => ({
  ...(await orig<typeof import('@/lib/ai-utils')>()),
  paceTokens: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = { completions: { create: mockCreate } };
    audio = { transcriptions: { create: mockTranscriptionsCreate } };
  },
}));

const MOCK_SUMMARY_RESPONSE = {
  title: 'Test Lecture',
  summary: 'This is a test summary.',
  paragraphs: ['Paragraph one.', 'Paragraph two.'],
  bulletPoints: ['Point A', 'Point B'],
  keyConcepts: [
    {
      concept: 'Concept A',
      explanation: 'Explanation',
      importance: 'high',
    },
  ],
  definitions: [
    {
      term: 'Term',
      definition: 'Definition',
      context: 'Context',
    },
  ],
  exampleProblems: [],
  quizQuestions: [
    {
      question: 'Question?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Because A',
    },
  ],
  actionItems: ['Action 1'],
};

describe('AI prompts (ai-prompts.ts)', () => {
  describe('TRANSLATE_PROMPTS', () => {
    it('has non-empty prompts for all three supported languages', () => {
      expect(TRANSLATE_PROMPTS.english.length).toBeGreaterThan(100);
      expect(TRANSLATE_PROMPTS.urdu.length).toBeGreaterThan(100);
      expect(TRANSLATE_PROMPTS['roman-urdu'].length).toBeGreaterThan(100);
    });
  });

  describe('FORMAT_PROMPTS', () => {
    it('has prompts for all three supported languages', () => {
      expect(FORMAT_PROMPTS.english).toBeTruthy();
      expect(FORMAT_PROMPTS.urdu).toBeTruthy();
      expect(FORMAT_PROMPTS['roman-urdu']).toBeTruthy();
    });

    it('English prompt preserves original content without inventing information', () => {
      expect(FORMAT_PROMPTS.english).toContain('Preserve the original meaning and context.');

      expect(FORMAT_PROMPTS.english).toContain('Never invent information, facts, or references.');
    });

    it('Urdu and Roman Urdu prompts contain general formatting instructions', () => {
      expect(FORMAT_PROMPTS.urdu).toContain('اہم معلومات');
      expect(FORMAT_PROMPTS['roman-urdu']).toContain(
        'Never invent information, facts, or references.'
      );
    });
  });

  describe('buildSummarizationPrompt', () => {
    it('uses English as the output language when English is selected', () => {
      const prompt = buildSummarizationPrompt({ language: 'english' });

      expect(prompt).toContain('English');
    });

    it('uses Urdu as the output language when Urdu is selected', () => {
      const prompt = buildSummarizationPrompt({ language: 'urdu' });

      expect(prompt).toContain('Urdu');
    });

    it('uses Roman Urdu as the output language when Roman Urdu is selected', () => {
      const prompt = buildSummarizationPrompt({ language: 'roman-urdu' });

      expect(prompt).toContain('Roman Urdu');
    });

    it('includes the detail level in the schema description', () => {
      const prompt = buildSummarizationPrompt({ detailLevel: 'concise' });

      expect(prompt).toContain('concise');
    });

    it('includes focus areas when specified', () => {
      const prompt = buildSummarizationPrompt({
        focusAreas: ['history', 'ethics'],
      });

      expect(prompt).toContain('history, ethics');
    });

    it('uses sane defaults when no options are provided', () => {
      const prompt = buildSummarizationPrompt({});

      expect(prompt).toContain('detailed');
      expect(prompt).toContain('all topics');
      expect(prompt).toContain('English');
    });

    it('returns a valid JSON schema structure description', () => {
      const prompt = buildSummarizationPrompt({});

      expect(prompt).toContain('"title"');
      expect(prompt).toContain('"summary"');
      expect(prompt).toContain('"quizQuestions"');
      expect(prompt).toContain('"keyConcepts"');
    });
  });
});

describe('getAIConfig', () => {
  it('returns groq config from test environment', () => {
    const config = getAIConfig();

    expect(config.provider).toBe('groq');
    expect(config.transcriptionModel).toBe('whisper-large-v3');
    expect(config.summarizationModel).toBe('openai/gpt-oss-20b');
    expect(config.apiKey).toBe('test-api-key');
  });

  it('has all required fields', () => {
    const config = getAIConfig();

    expect(config).toMatchObject({
      provider: expect.any(String),
      transcriptionModel: expect.any(String),
      summarizationModel: expect.any(String),
      apiKey: expect.any(String),
    });
  });
});

describe('getSummarizationConfig', () => {
  it('falls back to getAIConfig when AI_SUMMARIZATION_PROVIDER is unset', () => {
    const config = getSummarizationConfig();

    expect(config).toEqual(getAIConfig());
  });

  it('returns gemini config when AI_SUMMARIZATION_PROVIDER is gemini', () => {
    const originalProvider = process.env.AI_SUMMARIZATION_PROVIDER;
    const originalKey = process.env.GEMINI_API_KEY;

    try {
      process.env.AI_SUMMARIZATION_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const config = getSummarizationConfig();

      expect(config.provider).toBe('gemini');
      expect(config.summarizationModel).toBe('gemini-3.6-flash');
      expect(config.apiKey).toBe('test-gemini-key');

      // Transcription config is untouched by the summarization provider switch.
      expect(getAIConfig().provider).toBe('groq');
    } finally {
      if (originalProvider === undefined) {
        delete process.env.AI_SUMMARIZATION_PROVIDER;
      } else {
        process.env.AI_SUMMARIZATION_PROVIDER = originalProvider;
      }

      if (originalKey === undefined) {
        delete process.env.GEMINI_API_KEY;
      } else {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });
});

describe('translateTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['English', 'english'],
    ['Urdu', 'urdu'],
    ['Roman Urdu', 'roman-urdu'],
  ] as const)('calls the LLM API for %s translation', async (_label, language) => {
    const translated = 'Translated lecture transcript.';

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: translated } }],
    });

    const input = 'This is an English transcript.';
    const result = await translateTranscript(input, language);

    expect(result).toBe(translated);
    expect(mockCreate).toHaveBeenCalledOnce();

    const callArgs = mockCreate.mock.calls[0][0];

    expect(callArgs.messages[0].role).toBe('system');
    expect(callArgs.messages[0].content).toBe(TRANSLATE_PROMPTS[language]);
    expect(callArgs.messages[1].content).toBe(input);
  });

  it('throws when the translation API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Network error'));

    await expect(translateTranscript('Original transcript.', 'urdu')).rejects.toThrow();
  });
});

describe('formatTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns basic paragraphs when API key is empty', async () => {
    const originalKey = process.env.GROQ_API_KEY;

    try {
      process.env.GROQ_API_KEY = '';

      const longText = Array.from(
        { length: 10 },
        () => 'This is a sentence. It provides content for the test. Here is another sentence.'
      ).join(' ');

      const result = await formatTranscript(longText);

      expect(result).toBeTruthy();
      expect(mockCreate).not.toHaveBeenCalled();
    } finally {
      if (originalKey === undefined) {
        delete process.env.GROQ_API_KEY;
      } else {
        process.env.GROQ_API_KEY = originalKey;
      }
    }
  });

  it('calls the LLM API when API key is present', async () => {
    const formatted = '## Section 1\n\nFormatted text.';

    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: formatted } }],
    });

    const result = await formatTranscript('Short transcript.', 'english');

    expect(result).toBe(formatted);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('passes the correct system prompt for each supported language', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'formatted' } }],
    });

    const languages = ['english', 'urdu', 'roman-urdu'] as const;

    for (const language of languages) {
      vi.clearAllMocks();

      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'formatted' } }],
      });

      await formatTranscript('transcript', language);

      const callArgs = mockCreate.mock.calls[0][0];

      expect(callArgs.messages[0].content).toBe(FORMAT_PROMPTS[language]);
    }
  });

  it('falls back to basic paragraphs on API error', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'));

    const result = await formatTranscript('Sentence one. Sentence two.');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('summarizeTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when API key is not configured', async () => {
    const originalKey = process.env.GROQ_API_KEY;

    try {
      process.env.GROQ_API_KEY = '';

      await expect(summarizeTranscript('transcript', 'file.mp3')).rejects.toThrow(
        'API key not configured'
      );
    } finally {
      if (originalKey === undefined) {
        delete process.env.GROQ_API_KEY;
      } else {
        process.env.GROQ_API_KEY = originalKey;
      }
    }
  });

  it('parses and returns a valid LectureNotes object', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    const result = await summarizeTranscript('Lecture content goes here.', 'lecture.mp3');

    expect(result.title).toBe('Test Lecture');
    expect(result.summary).toBe('This is a test summary.');
    expect(result.paragraphs).toHaveLength(2);
    expect(result.quizQuestions).toHaveLength(1);
    expect(result.quizQuestions[0].correctAnswer).toBe(0);
    expect(result.metadata.originalFilename).toBe('lecture.mp3');
    expect(result.metadata.generatedAt).toBeTruthy();
  });

  it('condenses long transcripts in chunks instead of cropping', async () => {
    const longTranscript = 'word. '.repeat(40000);

    mockCreate.mockImplementation(async (args: any) =>
      args.response_format
        ? {
            choices: [
              {
                message: {
                  content: JSON.stringify(MOCK_SUMMARY_RESPONSE),
                },
              },
            ],
          }
        : { choices: [{ message: { content: 'digest' } }] }
    );

    const result = await summarizeTranscript(longTranscript, 'long-lecture.mp3');

    expect(mockCreate.mock.calls.length).toBeGreaterThan(2);
    expect(result.summary).not.toContain('cropped');

    mockCreate.mockReset();
  });

  it('includes word count and model info in metadata', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    const result = await summarizeTranscript('one two three', 'test.mp3');

    expect(result.metadata.wordCount).toBe(3);
    expect(result.metadata.transcriptionModel).toBeTruthy();
    expect(result.metadata.summarizationModel).toBeTruthy();
  });

  it('respects custom summarization options', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_SUMMARY_RESPONSE) } }],
    });

    await summarizeTranscript('transcript', 'file.mp3', {
      language: 'urdu',
      detailLevel: 'concise',
      focusAreas: ['ethics'],
    });

    const callArgs = mockCreate.mock.calls[0][0];
    const systemPrompt = callArgs.messages[0].content as string;

    expect(systemPrompt).toContain('Urdu');
    expect(systemPrompt).toContain('concise');
    expect(systemPrompt).toContain('ethics');
  });

  it('returns empty arrays for missing fields in the API response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: 'Minimal',
              summary: 'Short.',
            }),
          },
        },
      ],
    });

    const result = await summarizeTranscript('transcript', 'file.mp3');

    expect(result.paragraphs).toEqual([]);
    expect(result.bulletPoints).toEqual([]);
    expect(result.keyConcepts).toEqual([]);
    expect(result.quizQuestions).toEqual([]);
    expect(result.actionItems).toEqual([]);
  });
});
