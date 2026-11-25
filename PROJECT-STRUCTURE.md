# Lecunity Project Structure

This document describes the current source-code organization of Lecunity.

## 1. Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Manager:** pnpm
- **Media Processing:** FFmpeg and FFprobe
- **Media Downloading:** yt-dlp and direct HTTP/HTTPS media URLs
- **AI Services:** OpenAI, Groq, Gemini, and Anthropic (depending on the task and configuration)
- **Testing:** Vitest and Playwright configuration

## 2. Project Directory

```text
Lecunity-ai/
│
├── .github/                         # GitHub configuration and workflows
├── .vscode/                         # Editor configuration
│
├── actions/
│   └── transcription.ts             # Server Actions for media processing
│
├── app/
│   ├── api/
│   │   └── limits/
│   │       └── route.ts             # Rate-limit information endpoint
│   ├── test-error-boundary/
│   │   └── page.tsx                 # Error-boundary test page
│   ├── error.tsx                    # Route error UI
│   ├── global-error.tsx             # Global error UI
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root application layout
│   ├── loading.tsx                  # Loading UI
│   ├── not-found.tsx                # Not-found page
│   └── page.tsx                     # Main application page
│
├── components/
│   ├── error-boundary.tsx           # Error boundary component
│   ├── history.tsx                  # Previous results/history UI
│   ├── media-player.tsx             # Media playback component
│   ├── notes-display.tsx            # Generated notes display
│   ├── processing-steps.tsx         # Processing stages UI
│   ├── processing-tips.tsx          # Processing guidance
│   ├── progress.tsx                 # Progress display
│   └── upload.tsx                   # File and URL input UI
│
├── lib/
│   ├── __tests__/
│   │   ├── ai-utils.test.ts
│   │   ├── ai.test.ts
│   │   └── transcription-providers.test.ts
│   ├── ai-prompts.ts                # AI prompt templates
│   ├── ai-utils.ts                  # AI utility functions
│   ├── ai.ts                        # AI provider and generation logic
│   ├── ffmpeg.ts                    # FFmpeg media processing
│   ├── file-security.ts             # File validation and security checks
│   ├── media-downloader.ts          # Direct media URL downloading
│   ├── rate-limiter.ts              # Request rate limiting
│   ├── transcription-providers.ts   # Speech transcription providers
│   ├── upload.ts                    # Upload handling
│   └── youtube.ts                   # YouTube media handling
│
├── public/                          # Static public assets
├── scripts/                         # Project utility scripts
├── tests/                           # Additional tests
│
├── types/
│   └── index.ts                     # Shared TypeScript types
│
├── uploads/                         # Runtime upload storage
│
├── utils/
│   ├── format-api-error.test.ts     # API error formatting tests
│   ├── format-api-error.ts          # API error formatting
│   ├── history.ts                   # Browser history utilities
│   └── validateFile.ts              # File validation utilities
│
├── .dockerignore
├── .editorconfig
├── .env.example                     # Example environment configuration
├── .eslintrc.json
├── .gitignore
├── .npmrc
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CLI-REFERENCE.md
├── commitlint.config.js
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── DOCS.md
├── ERROR-BOUNDARY.md
├── FILE-SECURITY.md
├── GROQ-SETUP.md
├── LICENSE
├── MEDIA-PLAYER.md
├── next.config.js
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.js
├── PROJECT-STRUCTURE.md
├── QUICKSTART.md
├── RATE-LIMITS.md
├── README.md
├── setup.sh
├── SETUP.md
├── tailwind.config.js
├── TESTING.md
├── TROUBLESHOOTING.md
├── tsconfig.json
├── URL-SOURCE.md
├── vitest.config.mts
└── playwright.config.ts
```

## 3. Main Application Flow

1. The user uploads an audio/video file or provides a supported media URL.
2. The application validates the input.
3. Media is uploaded or downloaded for processing.
4. FFmpeg extracts and prepares audio when required.
5. A configured transcription provider converts speech into text.
6. AI services process the transcript to generate formatted notes and summaries.
7. The application returns the result to the user interface.
8. Previous results can be stored in browser local storage.

## 4. Important Modules

| Module                           | Responsibility                                                |
| -------------------------------- | ------------------------------------------------------------- |
| `actions/transcription.ts`       | Coordinates the transcription workflow through Server Actions |
| `lib/ffmpeg.ts`                  | Extracts, converts, and prepares audio                        |
| `lib/media-downloader.ts`        | Downloads supported direct media URLs                         |
| `lib/youtube.ts`                 | Handles YouTube media processing                              |
| `lib/transcription-providers.ts` | Integrates speech-to-text providers                           |
| `lib/ai.ts`                      | Handles AI generation and provider selection                  |
| `lib/ai-prompts.ts`              | Defines prompts for AI processing                             |
| `lib/file-security.ts`           | Performs file security checks                                 |
| `lib/rate-limiter.ts`            | Applies request limits                                        |
| `utils/history.ts`               | Manages browser-side history                                  |

## 5. Supported Output Languages

Lecunity currently supports these output languages:

- English
- Urdu (Urdu script)
- Roman Urdu

The selected output language controls the language used for generated content. It does not necessarily determine the spoken language of the original recording.

## 6. Data and Storage

- Previous results are stored in the user's browser using local storage.
- Browser history is limited to a maximum of 50 records.
- The current application does not provide user accounts or a shared database-backed history.
- Uploaded media uses the configured runtime upload storage.
- Local environment files such as `.env` and `.env.local` should not be committed to the repository.

## 7. API and Server Processing

The application uses Next.js Server Actions for the main media transcription workflow.

The currently implemented API route is:

```text
GET /api/limits
```

There is no separate `/api/transcribe` route. Transcription is coordinated through `actions/transcription.ts`.

## 8. Development Commands

Run these commands from the project root:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Run TypeScript checks
pnpm type-check

# Run tests
pnpm test:run

# Run the production build
pnpm build
```

Refer to `package.json` for the complete and authoritative list of available scripts.

## 9. Build Output

Next.js generates its build output in the `.next/` directory.

This directory is generated automatically and should not be treated as application source code.

## 10. Important Notes

- FFmpeg and FFprobe are required for media-processing operations.
- YouTube processing depends on the configured media tools and runtime environment.
- Direct URL processing requires a supported, downloadable media resource; not every website URL is supported.
- AI provider availability depends on valid API keys and provider configuration.
- Rate limits are process-local and are not a distributed rate-limiting system.
- Deployment compatibility depends on the hosting environment and availability of required media-processing binaries.

---

**Project:** Lecunity

**Framework:** Next.js 15
**Package Manager:** pnpm
**Language:** TypeScript
**Version Control:** Git
**License:** MIT
**Repository:** https://github.com/uxasad/Lecunity
**Documentation:** https://uxasad.github.io/Lecunity/
**Author:** Muhammad Asad Ullah
