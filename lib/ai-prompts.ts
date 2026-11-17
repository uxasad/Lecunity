
import type { SummarizationOptions } from '@/types';

/* =========================================
   TRANSLATION PROMPTS
========================================= */


export const TRANSLATE_PROMPTS: Record<
  'english' | 'urdu' | 'roman-urdu',
  string
> = {
  english: `You are a professional translator. Translate the provided lecture transcript into clear, natural English.

CRITICAL RULES:
1. Translate the complete transcript without removing important information, examples, or explanations.
2. Preserve original Arabic Quranic verses and Hadith text exactly as provided.
3. Preserve existing transliterations, translations, and references of Quran and Hadith quotations.
4. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
5. Use clear, natural English while preserving technical accuracy.
6. Maintain the original meaning, context, and paragraph structure.
7. Do not translate names, code, formulas, or technical identifiers unnecessarily.

Output the translated transcript directly without any preamble or additional explanation.`,

  urdu: `You are a professional translator. Translate the provided lecture transcript into natural, clear Pakistani Urdu written in Urdu script.

CRITICAL RULES:
1. Translate the complete transcript without removing important information, examples, or explanations.
2. Preserve original Arabic Quranic verses and Hadith text exactly as provided.
3. Preserve existing transliterations, translations, and references of Quran and Hadith quotations.
4. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
5. Use natural Pakistani Urdu rather than Hindi vocabulary.
6. Keep important technical terms in English where translating them would reduce clarity.
7. Maintain the original meaning, context, and paragraph structure.
8. Translate headings and explanations into Urdu script.
9. Do not translate names, code, formulas, or technical identifiers unnecessarily.

Output the translated transcript directly without any preamble or additional explanation.`,

  'roman-urdu': `You are a professional translator. Translate the provided lecture transcript into natural Pakistani Roman Urdu using Latin letters.

CRITICAL RULES:
1. Translate the complete transcript without removing important information, examples, or explanations.
2. Write Urdu explanations in natural Roman Urdu, not Hindi.
3. Preserve original Arabic Quranic verses and Hadith text exactly as provided.
4. Preserve existing transliterations, translations, and references of Quran and Hadith quotations.
5. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
6. Use natural Pakistani Urdu expressions written in Latin letters.
7. Keep important technical terms in English where translating them would reduce clarity.
8. Maintain the original meaning, context, and paragraph structure.
9. Translate headings and explanations into Roman Urdu.
10. Do not translate names, code, formulas, or technical identifiers unnecessarily.

Output the translated transcript directly without any preamble or additional explanation.`,
};
/* =========================================cl

/* =========================================
   FORMATTING PROMPTS
========================================= */

export const FORMAT_PROMPTS: Record<'urdu' | 'roman-urdu' | 'english', string> = {
  urdu: `آپ ایک اسسٹنٹ ہیں جو لیکچر کے ٹرانسکرپٹس کو پڑھنے میں آسان بناتا ہے۔

اہم اصول:
1. کسی بھی اہم معلومات، مثال یا وضاحت کو حذف، مختصر یا تبدیل نہ کریں۔
2. قرآن و حدیث کے اصل عربی متن کو مکمل طور پر محفوظ رکھیں۔
3. موجودہ ترجمہ، تلفظ اور حوالہ بھی بالکل محفوظ رکھیں۔
4. کوئی نیا عربی اقتباس، آیت، حدیث یا حوالہ خود سے نہ بنائیں۔
5. اصل مواد کو صرف بہتر ترتیب اور فارمیٹنگ دیں۔

فارمیٹنگ کے کام:
1. اہم موضوعات اور مرکزی خیالات کی شناخت کریں۔
2. موضوعات کو ## ذیلی عنوانات میں تقسیم کریں۔
3. پیراگراف کو مختصر اور واضح رکھیں۔
4. اہم اصطلاحات، مثالوں اور نکات کو نمایاں کریں۔
5. وضاحتیں آسان اور قدرتی اردو رسم الخط میں لکھیں۔
6. اصل عربی اقتباسات کو عربی رسم الخط میں ہی رکھیں۔
7. ضروری تکنیکی اصطلاحات کو English میں برقرار رکھ سکتے ہیں۔

مثال:

## پہلا موضوع

یہاں موضوع کی وضاحت آسان اور واضح اردو میں لکھیں۔

## دوسرا موضوع

یہاں اگلی وضاحت لکھیں۔`,

  'roman-urdu': `You are an assistant that formats lecture transcripts for better readability.

IMPORTANT RULES:
1. Never remove, summarize, or change important information, examples, or explanations.
2. Preserve original Arabic Quran and Hadith text completely.
3. Preserve existing translations, transliterations, and references.
4. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
5. Only improve the structure and formatting of the original content.

FORMATTING TASKS:
1. Identify the main topics and key ideas.
2. Divide content into sections using ## subheadings.
3. Keep paragraphs short and clear.
4. Highlight important terms, examples, and key points.
5. Write all explanations in natural Pakistani Roman Urdu using Latin letters.
6. Avoid Hindi vocabulary and use natural Pakistani Urdu expressions.
7. Keep original Arabic quotations in Arabic script.
8. Keep important technical terms in English where necessary.

Example:

## Pehla Topic

Yahan topic ki wazahat asaan aur wazeh Roman Urdu mein likhein.

## Doosra Topic

Yahan agli wazahat likhein.`,

  english: `You are an assistant that formats lecture transcripts for better readability.

IMPORTANT RULES:
1. Never remove, summarize, or change important information, examples, or explanations.
2. Preserve original Arabic Quran and Hadith text completely.
3. Preserve existing translations, transliterations, and references.
4. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
5. Only improve the structure and formatting of the original content.

FORMATTING TASKS:
1. Identify the main topics and key ideas.
2. Divide content into sections using ## subheadings.
3. Keep paragraphs short and clear.
4. Highlight important terms, examples, and key points.
5. Write explanations in clear, natural English.
6. Keep original Arabic quotations in Arabic script.
7. Keep important technical terms and names accurate.

Example:

## First Topic

Explain the topic in clear and simple English.

## Second Topic

Continue with the next explanation.`,
};

/* =========================================
   SUMMARIZATION LANGUAGE INSTRUCTIONS
========================================= */

export const SUMMARIZATION_LANGUAGE_INSTRUCTIONS: Record<
  'urdu' | 'roman-urdu' | 'english',
  string
> = {
  urdu: `تمام نوٹس اردو رسم الخط میں تیار کریں۔ آسان، واضح اور تعلیمی اردو استعمال کریں۔

قرآن و حدیث کے لیے اہم اصول:
1. اصل عربی متن کو مکمل طور پر محفوظ رکھیں۔
2. اگر ٹرانسکرپٹ میں ترجمہ، تلفظ یا حوالہ موجود ہے تو اسے بھی محفوظ رکھیں۔
3. موجودہ اقتباسات یا حوالہ جات کو تبدیل نہ کریں۔
4. کوئی آیت، حدیث، عربی متن یا حوالہ خود سے نہ بنائیں۔
5. وضاحتیں اور خلاصہ اردو رسم الخط میں لکھیں۔
6. ضروری تکنیکی اصطلاحات English میں برقرار رکھی جا سکتی ہیں۔

فارمیٹنگ:
- عنوان: اردو میں
- خلاصہ: اردو میں
- پیراگراف: اردو میں
- اہم نکات: اردو میں
- تصورات: اردو نام اور وضاحت
- تعریفیں: اردو میں
- سوالات اور جوابات: اردو میں
- ایکشن آئٹمز: اردو میں`,

  'roman-urdu': `Generate all notes in natural Pakistani Roman Urdu using Latin letters.

IMPORTANT RULES FOR QURAN AND HADITH:
1. Preserve original Arabic Quranic verses and Hadith text exactly as provided.
2. Preserve existing translations, transliterations, and references.
3. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
4. Write explanations and summaries in natural Pakistani Roman Urdu.
5. Avoid Hindi vocabulary.
6. Keep important technical terms in English where necessary.

FORMATTING:
- Title: Roman Urdu
- Summary: Roman Urdu
- Paragraphs: Roman Urdu
- Bullet points: Roman Urdu
- Concepts: Roman Urdu names and explanations
- Definitions: Roman Urdu
- Quiz questions and answers: Roman Urdu
- Action items: Roman Urdu`,

  english: `Generate all notes in clear, natural, academic English.

IMPORTANT RULES FOR QURAN AND HADITH:
1. Preserve original Arabic Quranic verses and Hadith text exactly as provided.
2. Preserve existing translations, transliterations, and references.
3. Never invent Arabic quotations, Quranic verses, Hadith text, or references.
4. Write explanations and summaries in clear English.
5. Keep important technical terms and names accurate.

FORMATTING:
- Title: English
- Summary: English
- Paragraphs: English
- Bullet points: English
- Concepts: English names and explanations
- Definitions: English
- Quiz questions and answers: English
- Action items: English`,
};

/* =========================================
   SUMMARIZATION JSON SCHEMA
========================================= */

export const SUMMARIZATION_JSON_SCHEMA = `{
  "title": "A clear, descriptive title for the lecture",
  "summary": "A {detailLevel} overview paragraph (3-5 sentences) summarizing the main themes and takeaways",
  "paragraphs": [
    "Array of well-structured paragraphs covering main topics in logical order",
    "Each paragraph should be 3-5 sentences",
    "Maintain academic writing style"
  ],
  "bulletPoints": [
    "Concise key points",
    "Action items",
    "Important facts",
    "Main arguments"
  ],
  "keyConcepts": [
    {
      "concept": "Concept name",
      "explanation": "Clear explanation",
      "importance": "high|medium|low"
    }
  ],
  "definitions": [
    {
      "term": "Technical term or concept",
      "definition": "Precise definition",
      "context": "How it's used in the lecture"
    }
  ],
  "exampleProblems": [
    {
      "problem": "Problem statement or question",
      "solution": "Solution if provided",
      "explanation": "Step-by-step explanation"
    }
  ],
  "quizQuestions": [
    {
      "question": "Multiple choice question to test understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ],
  "actionItems": [
    "Tasks mentioned",
    "Assignments",
    "Follow-up items",
    "Further reading suggestions"
  ]
}`;

/* =========================================
   BUILD SUMMARIZATION PROMPT
========================================= */

export function buildSummarizationPrompt(options: SummarizationOptions): string {
  const detailLevel = options.detailLevel || 'detailed';
  const focusAreas = options.focusAreas?.join(', ') || 'all topics';
  const language = options.language || 'english';

  const langKey: 'urdu' | 'roman-urdu' | 'english' =
    language === 'urdu'
      ? 'urdu'
      : language === 'roman-urdu'
        ? 'roman-urdu'
        : 'english';

  const languageInstruction = SUMMARIZATION_LANGUAGE_INSTRUCTIONS[langKey];

  const languageLabel =
    langKey === 'urdu'
      ? 'Urdu (Urdu script)'
      : langKey === 'roman-urdu'
        ? 'Roman Urdu (Latin script)'
        : 'English';

  const schema = SUMMARIZATION_JSON_SCHEMA.replace('{detailLevel}', detailLevel);

  return `You are an expert academic note-taker. Analyze the following lecture transcript and generate structured, comprehensive notes in JSON format.

${languageInstruction}

Focus on: ${focusAreas}
Detail level: ${detailLevel}

Generate a JSON object with the following structure:
${schema}

Rules:
- Extract all key concepts, definitions, and examples mentioned.
- Generate 5-10 multiple choice quiz questions that test comprehension of key concepts.
- Quiz questions should cover important topics from the lecture.
- Each quiz question must have 4 options with exactly one correct answer.
- correctAnswer is the index (0-3) of the correct option in the options array.
- Include an explanation for each quiz answer to aid learning.
- Organize information logically and hierarchically.
- Write all generated content in the specified language: ${languageLabel}.
- Preserve original Arabic Quran and Hadith quotations exactly as provided in the transcript.
- Do not invent Quranic verses, Hadith quotations, translations, or references.
- Identify relationships between concepts.
- Highlight important formulas, theories, or frameworks.
- Note any examples, case studies, or illustrations used.
- Capture action items and next steps.
- If no example problems are present, return an empty array.
- Ensure all JSON is valid and properly formatted.
- Do not include any text outside the JSON object.`;
}
