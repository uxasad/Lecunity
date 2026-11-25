import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  containsUrduScript,
  generateLectureNotesPdfBlob,
  sanitizePdfFilename,
} from '@/lib/pdf-export';
import type { LectureNotes } from '@/types';

const notes: LectureNotes = {
  title: 'Lecture: Energy & Motion',
  summary: 'A **short** summary with `code`.',
  paragraphs: ['A paragraph with **bold** and *italic* text.'],
  bulletPoints: ['First point', 'Second point'],
  keyConcepts: [{ concept: 'Energy', explanation: 'Energy is conserved.', importance: 'high' }],
  definitions: [{ term: 'Work', definition: 'Force applied over distance.', context: 'Physics' }],
  exampleProblems: [
    {
      problem: 'Find the speed.',
      solution: 'Use the energy equation.',
      explanation: 'Substitute values.',
    },
  ],
  quizQuestions: [
    {
      question: 'What is conserved?',
      options: ['Energy', 'Nothing'],
      correctAnswer: 0,
      explanation: 'Energy is conserved.',
    },
  ],
  actionItems: ['Review the equations'],
  metadata: {
    generatedAt: '2026-01-01T12:00:00.000Z',
    transcriptionModel: 'test',
    summarizationModel: 'test',
    originalFilename: 'lecture.mp3',
    wordCount: 20,
  },
};

function mockUrduFontFetch(): void {
  const regular = readFileSync('public/fonts/Lateef-Regular.ttf');
  const bold = readFileSync('public/fonts/Lateef-Bold.ttf');

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      return new Response(path.includes('Lateef-Bold.ttf') ? bold : regular, { status: 200 });
    })
  );
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read the generated PDF.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

describe('PDF export', () => {
  it('sanitizes filenames while retaining Unicode letters', () => {
    expect(sanitizePdfFilename('میکینکس / Week 2?.')).toBe('Lecunity-میکینکس-Week-2.pdf');
    expect(sanitizePdfFilename('***')).toBe('Lecunity-Lecture-Notes.pdf');
  });

  it('detects Urdu script but leaves Roman Urdu and English left-to-right', () => {
    expect(containsUrduScript('یہ ایک مثال ہے')).toBe(true);
    expect(containsUrduScript('Yeh aik misaal hai')).toBe(false);
    expect(containsUrduScript('This is an example')).toBe(false);
  });

  it('generates selectable-text PDFs with Markdown formatting in English and Roman Urdu', async () => {
    const markdownNotes = {
      ...notes,
      summary:
        '## Heading\n\nA **bold** paragraph.\n\n| Left | Right |\n| --- | --- |\n| A | B |\n\n```js\nconst answer = 42;\n```',
    };
    const englishPdf = await generateLectureNotesPdfBlob(markdownNotes);
    const romanUrduPdf = await generateLectureNotesPdfBlob({
      ...notes,
      summary: 'Yeh **Roman Urdu** ka chhota sa khulasa hai.',
    });

    expect(englishPdf.type).toBe('application/pdf');
    expect(englishPdf.size).toBeGreaterThan(2000);
    expect(romanUrduPdf.type).toBe('application/pdf');
    expect(romanUrduPdf.size).toBeGreaterThan(2000);
  }, 60_000);

  it('embeds the Urdu font and paginates long Urdu notes', async () => {
    mockUrduFontFetch();
    const urduNotes: LectureNotes = {
      ...notes,
      title: 'حرکت اور توانائی',
      summary: 'یہ خلاصہ ہے جس میں **اہم متن** اور `کوڈ` شامل ہیں۔',
      paragraphs: Array.from(
        { length: 60 },
        (_, index) => `تفصیلی نوٹ ${index + 1}: توانائی محفوظ رہتی ہے۔`
      ),
      transcript: 'یہ مکمل لیکچر ٹرانسکرپٹ ہے۔',
    };

    const blob = await generateLectureNotesPdfBlob(urduNotes);
    const bytes = new Uint8Array(await blobToArrayBuffer(blob));
    const pdfText = new TextDecoder().decode(bytes);
    const pageCount = (pdfText.match(/\/Type\s*\/Page\b/g) ?? []).length;

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(10_000);
    expect(pageCount).toBeGreaterThan(1);
    expect(pdfText).toContain('/ToUnicode');
  }, 60_000);
});
