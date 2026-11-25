# Lecunity Architecture

This document describes the current application architecture, main components, processing workflow, AI integrations, and implementation limitations of Lecunity.

## 1. Project Overview

Lecunity is an AI-powered learning application that converts audio and video lectures into transcripts and structured study notes.

The current workflow supports three input methods:

- Audio and video file uploads
- YouTube URLs
- Direct HTTP/HTTPS media download URLs

The application processes the provided media, generates a transcript, and uses AI models to produce formatted study content.

## 2. Technology Stack

| Technology    | Purpose                                                 |
| ------------- | ------------------------------------------------------- |
| Next.js 15    | Application framework                                   |
| React 19      | User interface                                          |
| TypeScript    | Type safety                                             |
| Tailwind CSS  | Styling                                                 |
| pnpm          | Package management                                      |
| FFmpeg        | Audio extraction, conversion, compression, and chunking |
| yt-dlp        | YouTube media downloading                               |
| OpenAI SDK    | OpenAI-compatible AI integrations                       |
| Groq API      | Speech transcription and text generation                |
| Gemini API    | Text generation                                         |
| Anthropic API | Text generation                                         |

## 3. High-Level Architecture

```text
                  USER
                    |
                    v
          Next.js Web Application
                    |
                    v
              Upload Interface
                    |
                    v
       Server Action: transcription.ts
                    |
          +---------+---------+
          |         |         |
          v         v         v
       File      YouTube   Direct URL
       Upload     URL      Download
          |         |         |
          v         v         v
       Validate  yt-dlp   HTTP/HTTPS
          |         |      Downloader
          +---------+---------+
                    |
                    v
             FFmpeg Processing
                    |
                    v
             Audio Processing
                    |
                    v
            Speech Transcription
                    |
                    v
           Transcript Processing
                    |
          +---------+---------+
          |         |         |
          v         v         v
      Translation Formatting Summary
          |         |         |
          +---------+---------+
                    |
                    v
             LectureNotes Result
                    |
                    v
              React Interface
                    |
                    v
          Browser Local Storage
```

## 4. Application Structure

The project follows the Next.js App Router structure.

```text
lecunity/
|
|-- actions/
|   |-- transcription.ts
|
|-- app/
|   |-- api/
|   |   |-- limits/
|   |       |-- route.ts
|   |
|   |-- test-error-boundary/
|   |   |-- page.tsx
|   |
|   |-- error.tsx
|   |-- global-error.tsx
|   |-- globals.css
|   |-- layout.tsx
|   |-- loading.tsx
|   |-- not-found.tsx
|   |-- page.tsx
|
|-- components/
|   |-- error-boundary.tsx
|   |-- history.tsx
|   |-- media-player.tsx
|   |-- notes-display.tsx
|   |-- processing-steps.tsx
|   |-- processing-tips.tsx
|   |-- progress.tsx
|   |-- upload.tsx
|
|-- lib/
|   |-- ai.ts
|   |-- ai-prompts.ts
|   |-- ai-utils.ts
|   |-- ffmpeg.ts
|   |-- file-security.ts
|   |-- media-downloader.ts
|   |-- rate-limiter.ts
|   |-- transcription-providers.ts
|   |-- upload.ts
|   |-- youtube.ts
|
|-- types/
|   |-- index.ts
|
|-- utils/
|   |-- format-api-error.ts
|   |-- history.ts
|   |-- validateFile.ts
|
|-- public/
|-- tests/
|-- scripts/
|-- package.json
|-- pnpm-lock.yaml
|-- next.config.ts
|-- tsconfig.json
```

## 5. Application Routes

| Route                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `/`                    | Main application interface              |
| `/api/limits`          | API endpoint for rate-limit information |
| `/test-error-boundary` | Error-boundary testing page             |

Media transcription is handled through a Next.js Server Action rather than a dedicated `/api/transcribe` route.

## 6. Media Input and Processing

The application accepts media through three input methods.

### A. File Upload

The user selects an audio or video file through the upload interface.

Processing:

1. Validate the uploaded file.
2. Save the file temporarily.
3. Check whether FFmpeg is available when video processing is required.
4. Extract audio from video files.
5. Compress audio when required.
6. Send audio for transcription.
7. Process the resulting transcript.
8. Clean up temporary files.

### B. YouTube URL

YouTube URLs are processed using yt-dlp.

Supported URL domains include:

- youtube.com
- www.youtube.com
- m.youtube.com
- youtu.be

Processing:

1. Validate the YouTube URL.
2. Download the audio using yt-dlp.
3. Convert the downloaded media into audio when required.
4. Compress audio when necessary.
5. Generate the transcript.
6. Generate study notes.
7. Clean up temporary files.

Playlist downloading is disabled.

### C. Direct Media URL

The application also accepts direct HTTP/HTTPS media URLs.

The downloader uses Node.js HTTP/HTTPS functionality to retrieve the media file.

Current limitations:

- The URL must provide a downloadable media file.
- Streaming pages and embedded players are not supported by the generic downloader.
- Google Drive and Dropbox integrations are not implemented.
- Authentication-based downloads are not supported by a dedicated integration.
- Comprehensive download-size and content-type validation is not implemented in the generic downloader.

A direct URL should not be considered compatible simply because it is publicly accessible.

## 7. Audio Processing

Audio processing is implemented in `lib/ffmpeg.ts`.

FFmpeg handles:

- Audio extraction from video.
- Audio format conversion.
- Audio compression.
- Audio duration detection.
- Audio chunk preparation.
- Temporary file cleanup.

Video audio extraction produces MP3 audio, generally using mono audio at 16 kHz.

Long audio files can be divided into smaller chunks. The current chunking configuration uses 600-second (10-minute) segments.

The transcription workflow processes chunks sequentially and uses a short portion of the previous chunk as context where available.

FFmpeg and FFprobe must be available in the execution environment for the corresponding media-processing operations.

## 8. AI Integration

AI functionality is implemented mainly in `lib/ai.ts` and `lib/transcription-providers.ts`.

The application separates speech transcription from text generation.

### Speech Transcription Providers

| Provider | Function            |
| -------- | ------------------- |
| OpenAI   | Audio transcription |
| Groq     | Audio transcription |
| Deepgram | Audio transcription |

### Text Generation Providers

| Provider  | Function                                   |
| --------- | ------------------------------------------ |
| OpenAI    | Translation, formatting, and summarization |
| Groq      | Translation, formatting, and summarization |
| Gemini    | Translation, formatting, and summarization |
| Anthropic | Summarization                              |

Provider selection is controlled through environment variables.

- `AI_PROVIDER` controls transcription.
- `AI_SUMMARIZATION_PROVIDER` controls text generation and can fall back to `AI_PROVIDER` when unset.

The configured environment determines which provider is actually used.

## 9. Transcript and Study Notes Generation

After transcription, the application performs three text-processing operations:

1. **Translation:** Converts the transcript into the selected output language.
2. **Formatting:** Organizes transcript text into readable paragraphs.
3. **Summarization:** Generates structured study content.

These operations are performed through the AI processing functions.

### Supported Output Languages

- English
- Urdu (اردو)
- Roman Urdu

Speech transcription detects the spoken language independently of the selected output language.

### LectureNotes Structure

The generated result follows the `LectureNotes` TypeScript interface.

It can contain:

- Title
- Summary
- Paragraphs
- Bullet points
- Key concepts
- Definitions
- Example problems
- Quiz questions
- Action items
- Original transcript
- Processing metadata

The actual fields returned depend on the processing workflow and available model output.

## 10. Frontend Architecture

The main application page is implemented in `app/page.tsx`.

It manages the main application state, including:

- Generated lecture notes
- Processing errors
- History visibility
- Restoring previously generated notes

The interface is divided into reusable React components.

| Component              | Responsibility               |
| ---------------------- | ---------------------------- |
| `upload.tsx`           | Media input and submission   |
| `notes-display.tsx`    | Generated notes presentation |
| `history.tsx`          | Previous results             |
| `media-player.tsx`     | Floating media player        |
| `processing-steps.tsx` | Processing stages            |
| `processing-tips.tsx`  | Processing guidance          |
| `progress.tsx`         | Progress presentation        |
| `error-boundary.tsx`   | React error handling         |

## 11. Browser History

History is stored in browser `localStorage`, not in a server database.

Storage keys:

- `lecunity_last_result`
- `lecunity_history`

The history utility is implemented in `utils/history.ts`.

Current behavior:

- Stores a maximum of 50 history records.
- Sorts records by timestamp.
- Supports retrieving individual records.
- Supports deleting individual records.
- Supports clearing the complete history.

History is specific to the browser and device where it was created. It is not automatically synchronized between devices.

## 12. Rate Limiting

Rate limiting is implemented in `lib/rate-limiter.ts`.

Current configured limits:

| Limit                                  | Maximum |
| -------------------------------------- | ------: |
| Hourly transcription requests          |       5 |
| Rolling 24-hour transcription requests |      20 |

Requests are identified using the client IP address obtained from request headers.

**Implementation limitation:** The rate limiter uses an in-memory JavaScript Map. Consequently, its records are local to the running application process and are not shared between multiple server instances. Records are also lost when the process restarts.

A shared persistent rate-limiting service would be required for reliable multi-instance production enforcement.

## 13. File Validation and Security

File validation is implemented in `utils/validateFile.ts`.

The application checks uploaded files and applies configured size restrictions.

The default general file-size limit in the code is 50 MB when no environment override is supplied. The example environment configuration sets it to 100 MB.

Other security-related modules include:

- `lib/file-security.ts`
- `lib/upload.ts`
- `utils/validateFile.ts`
- `lib/rate-limiter.ts`

Security behavior should be evaluated against the actual implementation and deployment environment. A generic direct URL downloader requires additional protections, particularly against server-side request forgery (SSRF), before it can be considered safe for unrestricted public use.

## 14. Environment Configuration

Environment variables configure AI providers and media-processing behavior.

Important configuration variables include:

| Variable                    | Purpose                          |
| --------------------------- | -------------------------------- |
| `AI_PROVIDER`               | Speech transcription provider    |
| `AI_SUMMARIZATION_PROVIDER` | Text generation provider         |
| `GROQ_API_KEY`              | Groq authentication              |
| `OPENAI_API_KEY`            | OpenAI authentication            |
| `DEEPGRAM_API_KEY`          | Deepgram authentication          |
| `GEMINI_API_KEY`            | Gemini authentication            |
| `ANTHROPIC_API_KEY`         | Anthropic authentication         |
| `MAX_FILE_SIZE_MB`          | General uploaded file-size limit |
| `FFMPEG_PATH`               | Optional FFmpeg executable path  |
| `FFPROBE_PATH`              | Optional FFprobe executable path |

Use `.env.example` as the configuration reference. Actual API keys must remain in private environment configuration and must never be committed to the repository.

## 15. Current Architecture Limitations

The following limitations are important when evaluating the current implementation:

1. History is stored locally in the browser.
2. Rate limiting is process-local and in-memory.
3. Direct URL support is limited to basic HTTP/HTTPS downloads.
4. FFmpeg and yt-dlp availability depends on the execution environment.
5. No persistent user-account or database-backed history system is implemented.
6. Media-processing compatibility depends on the installed tools, provider limits, and deployment platform.
7. The processing-status action does not currently provide a real-time background job tracker.

## 16. Summary

Lecunity uses a Next.js application with server-side media processing and external AI services.

The main processing pipeline is:

**Media Input → Validation → Audio Processing → Transcription → Translation and Formatting → AI Summarization → Structured Study Notes**

The architecture is organized into separate modules for media handling, AI integration, frontend components, validation, and browser history. This separation makes the codebase easier to maintain and provides a foundation for future improvements.
