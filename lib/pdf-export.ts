import { createElement, type ReactNode } from 'react';
import { marked, type Token, type Tokens } from 'marked';
import type { LectureNotes } from '@/types';

type PdfModule = typeof import('@react-pdf/renderer');
type LanguageDirection = 'rtl' | 'ltr';

const URDU_FONT = 'Lateef';
const URDU_SCRIPT_PATTERN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/u;
let urduFontRegistered = false;

const logoPath =
  'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a2 2 0 0 1 .707.293l5.414 5.414a2 2 0 0 1 .293.707V19a2 2 0 0 1-2 2Z';

export function containsUrduScript(text: string): boolean {
  return URDU_SCRIPT_PATTERN.test(text);
}

export function sanitizePdfFilename(title: string): string {
  const safeTitle = title
    .normalize('NFKC')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/[^\p{L}\p{N}._ -]/gu, '-')
    .replace(/[\s._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');

  return `Lecunity-${safeTitle || 'Lecture-Notes'}.pdf`;
}

function directionFor(text: string): LanguageDirection {
  return containsUrduScript(text) ? 'rtl' : 'ltr';
}

function textStyle(text: string): Record<string, string | number> {
  const direction = directionFor(text);
  return {
    direction,
    textAlign: direction === 'rtl' ? 'right' : 'left',
    fontFamily: direction === 'rtl' ? URDU_FONT : 'Helvetica',
  };
}

function inlineContent(Pdf: PdfModule, tokens: Token[], keyPrefix: string): ReactNode[] {
  const { Text, Link } = Pdf;

  return tokens.flatMap((token, index): ReactNode[] => {
    const key = `${keyPrefix}-${index}`;

    switch (token.type) {
      case 'text':
        return 'tokens' in token && token.tokens
          ? inlineContent(Pdf, token.tokens, key)
          : [createElement(Text, { key, style: textStyle(token.text) }, token.text)];
      case 'escape':
      case 'codespan':
        return [
          createElement(
            Text,
            {
              key,
              style: {
                fontFamily: 'Courier',
                backgroundColor: '#f3f4f6',
                color: '#111827',
              },
            },
            token.text
          ),
        ];
      case 'strong':
        return [
          createElement(
            Text,
            { key, style: { fontWeight: 'bold' } },
            inlineContent(Pdf, token.tokens ?? [], key)
          ),
        ];
      case 'em':
        return [
          createElement(
            Text,
            { key, style: { fontStyle: 'italic' } },
            inlineContent(Pdf, token.tokens ?? [], key)
          ),
        ];
      case 'del':
        return [
          createElement(
            Text,
            { key, style: { textDecoration: 'line-through' } },
            inlineContent(Pdf, token.tokens ?? [], key)
          ),
        ];
      case 'link': {
        const safeHref = /^(https?:|mailto:)/i.test(token.href) ? token.href : undefined;
        const children = inlineContent(Pdf, token.tokens ?? [], key);
        return [
          safeHref
            ? createElement(Link, { key, src: safeHref, style: { color: '#557900' } }, children)
            : createElement(Text, { key }, children),
        ];
      }
      case 'image':
        return token.text ? [createElement(Text, { key }, `[Image: ${token.text}]`)] : [];
      case 'br':
        return [createElement(Text, { key }, '\n')];
      case 'html':
        return [createElement(Text, { key }, token.text.replace(/<[^>]*>/g, ''))];
      default:
        return 'text' in token && typeof token.text === 'string'
          ? [createElement(Text, { key }, token.text)]
          : [];
    }
  });
}

function markdownBlocks(Pdf: PdfModule, tokens: Token[], keyPrefix: string): ReactNode[] {
  const { Text, View } = Pdf;

  return tokens.flatMap((token, index): ReactNode[] => {
    const key = `${keyPrefix}-${index}`;

    switch (token.type) {
      case 'space':
      case 'def':
        return [];
      case 'heading':
        return [
          createElement(
            Text,
            {
              key,
              style: [
                {
                  fontSize: [0, 19, 16, 13][Math.min(token.depth, 3)],
                  fontWeight: 'bold',
                  marginTop: 10,
                  marginBottom: 5,
                },
                textStyle(token.text),
              ],
            },
            inlineContent(Pdf, token.tokens ?? [], key)
          ),
        ];
      case 'paragraph':
      case 'text':
        return [
          createElement(
            Text,
            {
              key,
              style: [{ fontSize: 10, lineHeight: 1.45, marginBottom: 8 }, textStyle(token.text)],
            },
            inlineContent(
              Pdf,
              'tokens' in token && token.tokens ? token.tokens : marked.lexer(token.text),
              key
            )
          ),
        ];
      case 'code':
        return [
          createElement(
            Text,
            {
              key,
              style: {
                fontFamily: 'Courier',
                fontSize: 8.5,
                lineHeight: 1.35,
                backgroundColor: '#f3f4f6',
                padding: 8,
                marginBottom: 8,
              },
            },
            token.text
          ),
        ];
      case 'blockquote':
        return [
          createElement(
            View,
            {
              key,
              style: {
                borderLeftWidth: directionFor(token.text) === 'ltr' ? 2 : 0,
                borderRightWidth: directionFor(token.text) === 'rtl' ? 2 : 0,
                borderColor: '#86b500',
                paddingHorizontal: 10,
                marginVertical: 4,
              },
            },
            markdownBlocks(Pdf, token.tokens ?? [], key)
          ),
        ];
      case 'list': {
        const listToken = token as Tokens.List;
        const isRtl = directionFor(listToken.raw) === 'rtl';

        return [
          createElement(
            View,
            {
              key,
              style: { marginBottom: 8, paddingLeft: isRtl ? 0 : 12, paddingRight: isRtl ? 12 : 0 },
            },
            listToken.items.map((item: Tokens.ListItem, itemIndex: number) => {
              const marker = item.task
                ? item.checked
                  ? '[x]'
                  : '[ ]'
                : listToken.ordered
                  ? `${(typeof listToken.start === 'number' ? listToken.start : 1) + itemIndex}.`
                  : '\u2022';
              const itemKey = `${key}-item-${itemIndex}`;

              return createElement(
                View,
                {
                  key: itemKey,
                  style: {
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    marginBottom: 3,
                  },
                },
                [
                  createElement(
                    Text,
                    {
                      key: `${itemKey}-marker`,
                      style: {
                        width: 22,
                        fontFamily: 'Helvetica',
                        textAlign: isRtl ? 'right' : 'left',
                        fontSize: 9,
                      },
                    },
                    marker
                  ),
                  createElement(
                    View,
                    { key: `${itemKey}-content`, style: { flex: 1 } },
                    markdownBlocks(Pdf, item.tokens, itemKey)
                  ),
                ]
              );
            })
          ),
        ];
      }
      case 'table': {
        const tableToken = token as Tokens.Table;
        const allRows = [tableToken.header, ...tableToken.rows];

        return [
          createElement(
            View,
            {
              key,
              style: {
                marginVertical: 4,
                marginBottom: 10,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderColor: '#d1d5db',
              },
            },
            allRows.map((row, rowIndex) =>
              createElement(
                View,
                {
                  key: `${key}-row-${rowIndex}`,
                  style: {
                    flexDirection:
                      directionFor(row.map((cell) => cell.text).join(' ')) === 'rtl'
                        ? 'row-reverse'
                        : 'row',
                  },
                },
                row.map((cell: Tokens.TableCell, cellIndex: number) =>
                  createElement(
                    View,
                    {
                      key: `${key}-cell-${rowIndex}-${cellIndex}`,
                      style: {
                        flex: 1,
                        padding: 5,
                        borderRightWidth: 1,
                        borderBottomWidth: 1,
                        borderColor: '#d1d5db',
                        ...(rowIndex === 0 ? { backgroundColor: '#eef3e7' } : {}),
                      },
                    },
                    createElement(
                      Text,
                      {
                        style: [
                          { fontSize: 9, ...(rowIndex === 0 ? { fontWeight: 'bold' } : {}) },
                          textStyle(cell.text),
                          cell.align ? { textAlign: cell.align } : {},
                        ],
                      },
                      inlineContent(Pdf, cell.tokens, `${key}-cell-${rowIndex}-${cellIndex}`)
                    )
                  )
                )
              )
            )
          ),
        ];
      }
      case 'hr':
        return [
          createElement(View, {
            key,
            style: { borderBottomWidth: 1, borderColor: '#d1d5db', marginVertical: 8 },
          }),
        ];
      default:
        return [];
    }
  });
}

function addSection(Pdf: PdfModule, title: string, markdown: string, key: string): ReactNode[] {
  if (!markdown.trim()) return [];
  return [
    createElement(
      Pdf.Text,
      {
        key: `${key}-heading`,
        style: {
          fontSize: 15,
          fontWeight: 'bold',
          color: '#355b00',
          marginTop: 18,
          marginBottom: 8,
        },
      },
      title
    ),
    ...markdownBlocks(Pdf, marked.lexer(markdown), key),
  ];
}

function getNotesText(notes: LectureNotes): string {
  return [
    notes.title,
    notes.summary,
    ...notes.paragraphs,
    ...notes.bulletPoints,
    ...notes.keyConcepts.flatMap((concept) => [concept.concept, concept.explanation]),
    ...notes.definitions.flatMap((definition) => [
      definition.term,
      definition.definition,
      definition.context ?? '',
    ]),
    ...notes.exampleProblems.flatMap((problem) => [
      problem.problem,
      problem.solution ?? '',
      problem.explanation ?? '',
    ]),
    ...notes.quizQuestions.flatMap((question) => [
      question.question,
      ...question.options,
      question.explanation ?? '',
    ]),
    ...notes.actionItems,
    notes.transcript ?? '',
  ].join('\n');
}

function notesContent(Pdf: PdfModule, notes: LectureNotes): ReactNode[] {
  const { Text, View } = Pdf;
  const content: ReactNode[] = [];

  content.push(...addSection(Pdf, 'Summary', notes.summary, 'summary'));

  if (notes.bulletPoints.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'key-points-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Key Points'
      ),
      createElement(
        View,
        { key: 'key-points-list' },
        notes.bulletPoints.map((point, index) => {
          const isRtl = directionFor(point) === 'rtl';
          return createElement(
            View,
            {
              key: `key-point-${index}`,
              style: { flexDirection: isRtl ? 'row-reverse' : 'row', marginBottom: 3 },
            },
            [
              createElement(
                Text,
                { key: 'marker', style: { width: 20, fontFamily: 'Helvetica' } },
                '\u2022'
              ),
              createElement(
                Text,
                { key: 'text', style: textStyle(point) },
                inlineContent(Pdf, marked.lexer(point), `key-point-${index}`)
              ),
            ]
          );
        })
      )
    );
  }

  if (notes.paragraphs.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'detailed-notes-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Detailed Notes'
      )
    );
    notes.paragraphs.forEach((paragraph, index) => {
      content.push(...markdownBlocks(Pdf, marked.lexer(paragraph), `paragraph-${index}`));
    });
  }

  if (notes.keyConcepts.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'concepts-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Key Concepts'
      )
    );
    notes.keyConcepts.forEach((concept, index) => {
      content.push(
        createElement(
          Text,
          {
            key: `concept-${index}-title`,
            style: [
              { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
              textStyle(concept.concept),
            ],
          },
          concept.concept
        ),
        ...markdownBlocks(Pdf, marked.lexer(concept.explanation), `concept-${index}-explanation`),
        createElement(
          Text,
          {
            key: `concept-${index}-importance`,
            style: { fontSize: 9, color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
          },
          `Importance: ${concept.importance}`
        )
      );
    });
  }

  if (notes.definitions.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'definitions-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Definitions'
      )
    );
    notes.definitions.forEach((definition, index) => {
      content.push(
        createElement(
          Text,
          {
            key: `definition-${index}-term`,
            style: [
              { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
              textStyle(definition.term),
            ],
          },
          definition.term
        ),
        ...markdownBlocks(Pdf, marked.lexer(definition.definition), `definition-${index}-text`)
      );
      if (definition.context) {
        content.push(
          ...markdownBlocks(
            Pdf,
            marked.lexer(`*Context:* ${definition.context}`),
            `definition-${index}-context`
          )
        );
      }
    });
  }

  if (notes.exampleProblems.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'examples-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Example Problems'
      )
    );
    notes.exampleProblems.forEach((problem, index) => {
      content.push(
        createElement(
          Text,
          {
            key: `problem-${index}-heading`,
            style: { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
          },
          `Problem ${index + 1}`
        ),
        ...markdownBlocks(Pdf, marked.lexer(problem.problem), `problem-${index}`)
      );
      if (problem.solution) {
        content.push(
          createElement(
            Text,
            {
              key: `problem-${index}-solution-heading`,
              style: { fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 3 },
            },
            'Solution'
          ),
          ...markdownBlocks(Pdf, marked.lexer(problem.solution), `problem-${index}-solution`)
        );
      }
      if (problem.explanation) {
        content.push(
          ...markdownBlocks(Pdf, marked.lexer(problem.explanation), `problem-${index}-explanation`)
        );
      }
    });
  }

  if (notes.quizQuestions.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'quiz-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Quiz Questions'
      )
    );
    notes.quizQuestions.forEach((question, index) => {
      content.push(
        createElement(
          Text,
          {
            key: `quiz-${index}-question-heading`,
            style: { fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
          },
          `Question ${index + 1}`
        ),
        ...markdownBlocks(Pdf, marked.lexer(question.question), `quiz-${index}-question`),
        createElement(
          View,
          { key: `quiz-${index}-options`, style: { marginBottom: 6 } },
          question.options.map((option, optionIndex) => {
            const optionText = `${optionIndex + 1}. ${option}${optionIndex === question.correctAnswer ? '  (Correct answer)' : ''}`;
            return createElement(
              Text,
              {
                key: `quiz-${index}-option-${optionIndex}`,
                style: [{ fontSize: 10, marginBottom: 3 }, textStyle(option)],
              },
              optionText
            );
          })
        )
      );
      if (question.explanation) {
        content.push(
          createElement(
            Text,
            {
              key: `quiz-${index}-explanation-heading`,
              style: { fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 3 },
            },
            'Explanation'
          ),
          ...markdownBlocks(Pdf, marked.lexer(question.explanation), `quiz-${index}-explanation`)
        );
      }
    });
  }

  if (notes.actionItems.length) {
    content.push(
      createElement(
        Text,
        {
          key: 'actions-heading',
          style: {
            fontSize: 15,
            fontWeight: 'bold',
            color: '#355b00',
            marginTop: 18,
            marginBottom: 8,
          },
        },
        'Action Items'
      ),
      createElement(
        View,
        { key: 'actions-list' },
        notes.actionItems.map((item, index) => {
          const isRtl = directionFor(item) === 'rtl';
          return createElement(
            View,
            {
              key: `action-${index}`,
              style: { flexDirection: isRtl ? 'row-reverse' : 'row', marginBottom: 3 },
            },
            [
              createElement(
                Text,
                { key: 'checkbox', style: { width: 24, fontFamily: 'Helvetica' } },
                '[ ]'
              ),
              createElement(
                Text,
                { key: 'text', style: textStyle(item) },
                inlineContent(Pdf, marked.lexer(item), `action-${index}`)
              ),
            ]
          );
        })
      )
    );
  }

  if (notes.transcript) {
    content.push(...addSection(Pdf, 'Full Transcript', notes.transcript, 'transcript'));
  }

  return content;
}

function registerUrduFont(Pdf: PdfModule): void {
  if (urduFontRegistered) return;
  const fontBaseUrl = `${window.location.origin}/fonts/`;

  Pdf.Font.register({
    family: URDU_FONT,
    src: `${fontBaseUrl}Lateef-Regular.ttf`,
    fontWeight: 400,
  });
  Pdf.Font.register({
    family: URDU_FONT,
    src: `${fontBaseUrl}Lateef-Bold.ttf`,
    fontWeight: 700,
  });
  Pdf.Font.register({
    family: URDU_FONT,
    src: `${fontBaseUrl}Lateef-Regular.ttf`,
    fontStyle: 'italic',
  });
  Pdf.Font.register({
    family: URDU_FONT,
    src: `${fontBaseUrl}Lateef-Bold.ttf`,
    fontStyle: 'italic',
    fontWeight: 700,
  });
  urduFontRegistered = true;
}

export async function generateLectureNotesPdfBlob(
  notes: LectureNotes,
  generatedAt = new Date()
): Promise<Blob> {
  const Pdf = await import('@react-pdf/renderer');

  if (containsUrduScript(getNotesText(notes))) {
    registerUrduFont(Pdf);
  }

  const { Document, Page, Text, View, Svg, Path } = Pdf;
  const content = [
    createElement(
      View,
      {
        key: 'document-brand',
        style: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
      },
      [
        createElement(
          Svg,
          { key: 'logo', width: 28, height: 28, viewBox: '0 0 24 24', style: { marginRight: 10 } },
          createElement(Path, {
            d: logoPath,
            fill: 'none',
            stroke: '#86b500',
            strokeWidth: 2,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          })
        ),
        createElement(View, { key: 'brand-text' }, [
          createElement(
            Text,
            { key: 'brand-name', style: { fontSize: 20, fontWeight: 'bold', color: '#355b00' } },
            'Lecunity'
          ),
          createElement(
            Text,
            { key: 'brand-type', style: { fontSize: 9, color: '#6b7280', letterSpacing: 0.6 } },
            'Lecture Notes'
          ),
        ]),
      ]
    ),
    createElement(
      Text,
      {
        key: 'lecture-title',
        style: [
          { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
          textStyle(notes.title),
        ],
      },
      notes.title
    ),
    createElement(
      Text,
      {
        key: 'document-date',
        style: { fontSize: 8.5, color: '#6b7280', marginTop: 5, marginBottom: 2 },
      },
      `Document generated ${generatedAt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`
    ),
    createElement(
      Text,
      { key: 'source-metadata', style: { fontSize: 8.5, color: '#6b7280', marginBottom: 18 } },
      `Source: ${notes.metadata.originalFilename}  |  ${notes.metadata.wordCount.toLocaleString()} words`
    ),
    ...notesContent(Pdf, notes),
  ];

  const document = createElement(
    Document,
    {
      title: notes.title,
      author: 'Lecunity',
      subject: 'Lecture notes',
    },
    createElement(
      Page,
      {
        size: 'A4',
        wrap: true,
        style: {
          backgroundColor: '#ffffff',
          color: '#1f2937',
          fontFamily: 'Helvetica',
          fontSize: 10,
          paddingTop: 48,
          paddingBottom: 52,
          paddingHorizontal: 52,
        },
      },
      [
        ...content,
        createElement(
          Text,
          {
            key: 'page-footer',
            fixed: true,
            render: ({ pageNumber, totalPages }) =>
              `Lecunity  |  Lecture Notes                                      ${pageNumber} / ${totalPages}`,
            style: {
              position: 'absolute',
              bottom: 20,
              left: 52,
              right: 52,
              textAlign: 'center',
              fontSize: 8,
              color: '#6b7280',
            },
          },
          ''
        ),
      ]
    )
  );

  return Pdf.pdf(document).toBlob();
}

export async function downloadLectureNotesPdf(notes: LectureNotes): Promise<void> {
  const blob = await generateLectureNotesPdfBlob(notes);
  if (!blob.size) throw new Error('The PDF was empty. Please try generating it again.');

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizePdfFilename(notes.title);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
