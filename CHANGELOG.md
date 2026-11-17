# Changelog

All notable changes to Lecunity are documented in this file.

## [3.2.0] - 2026-11-18

### Added

- **Chunked transcription:** Long audio is divided into smaller chunks and processed sequentially.
- **Chunk continuity:** Previous chunk context is used to improve continuity between transcription segments.
- **Token pacing:** Added token pacing to manage API request usage.
- **Chunked text processing:** Long transcripts can be processed in smaller sections instead of relying on a single large request.
- **Gemini summarization support:** Added Gemini as a configurable AI provider for summarization.
- **Benchmark utilities:** Added benchmark scripts for comparing transcription approaches.

### Improved

- **Transcription reliability:** Improved audio preparation and processing for longer recordings.
- **Timestamp handling:** Chunk offsets are applied to transcription segments.
- **API retry handling:** Improved handling of temporary request failures and rate-limit responses.
- **AI processing:** Improved provider configuration and separation of transcription and summarization settings.
- **Processing performance:** Translation, formatting, and summarization workflows were improved.

### Changed

- Updated AI prompts and processing logic.
- Updated project configuration and dependency lockfile.
- Improved application components and processing workflows.
- Updated documentation for the current project structure and configuration.
- Prepared project configuration for Vercel deployment.

### Current Application Capabilities

- Audio and video file uploads.
- YouTube media processing.
- Supported direct HTTP/HTTPS media URLs.
- Speech transcription.
- AI-generated lecture notes and summaries.
- English, Urdu, and Roman Urdu output.
- Browser-based history with a maximum of 50 saved results.

### Current Limitations

- User accounts and authentication are not implemented.
- History is stored in browser local storage rather than a shared database.
- Direct URL processing requires a supported downloadable media resource.
- AI functionality depends on configured provider API keys.
- Deployment preparation does not guarantee that all media-processing dependencies are supported by every hosting environment.

---

## Versioning Guidelines

Lecunity follows semantic versioning:

- **Major (X.0.0):** Breaking changes or major architectural updates.
- **Minor (0.X.0):** New features that maintain backward compatibility.
- **Patch (0.0.X):** Bug fixes and smaller improvements.

## Change Categories

- **Added:** New functionality.
- **Changed:** Changes to existing functionality.
- **Improved:** Performance, reliability, or usability improvements.
- **Fixed:** Bug fixes.
- **Removed:** Removed functionality.
- **Security:** Security-related changes.
