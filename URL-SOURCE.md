# URL Source Support

## Overview

Lecunity provides three ways to submit lecture content:

1. File Upload
2. YouTube URL
3. Direct Media URL

Both URL input methods download audio to the server before sending it through the transcription and note-generation pipeline.

## 1. YouTube URL

Lecunity uses `yt-dlp` to download audio from supported YouTube video URLs.

### Recognized URL domains

- `youtube.com`
- `www.youtube.com`
- `m.youtube.com`
- `youtu.be`

### Processing

1. The user submits a YouTube video URL.
2. Lecunity validates the URL domain.
3. `yt-dlp` downloads and extracts the audio.
4. Audio is converted to MP3.
5. Audio larger than 24 MB is passed through the compression process.
6. The transcription service generates a transcript.
7. Lecunity translates and formats the transcript into the selected output language.
8. The AI generates structured lecture notes.

### Download configuration

- Audio extraction: enabled
- Audio format: MP3
- Playlist downloads: disabled
- Maximum source download size: 500 MB
- Download command timeout: 5 minutes

**Requirement:** `yt-dlp` and FFmpeg must be available in the server environment.

## 2. Direct Media URL

Lecunity also accepts direct HTTP or HTTPS URLs.

### Supported URL format

The backend accepts URLs using:

- HTTP
- HTTPS

The URL should point directly to a publicly accessible audio or video file.

Examples of URL formats:

- `https://example.com/audio/lecture.mp3`
- `https://example.com/videos/lecture.mp4`

These are examples of URL formats, not verified external media sources.

### Processing

1. The user submits a direct media URL.
2. Lecunity checks that the URL uses HTTP or HTTPS.
3. The server downloads the response into its uploads directory.
4. Empty downloaded files are rejected.
5. Audio larger than 24 MB is passed through the compression process.
6. The transcription service generates a transcript.
7. Lecunity translates and formats the transcript into the selected output language.
8. The AI generates structured lecture notes.
9. Downloaded and compressed files are cleaned up after successful processing or errors.

### Current limitations

- The URL must provide a directly downloadable media response.
- The downloader does not extract media from arbitrary streaming websites.
- Google Drive and Dropbox integration is not implemented.
- Authentication-required URLs are not supported by a dedicated authentication mechanism.
- The downloader does not currently enforce a maximum downloaded-file size.
- The server does not currently verify that every HTTP response contains valid audio or video.
- HTTP redirects with status codes 301 and 302 are handled.

## 3. Output Languages

Lecunity currently provides three output language options:

- English
- Urdu (اردو)
- Roman Urdu

The original speech language is automatically detected during transcription. The selected language controls the generated transcript formatting and lecture notes.

## 4. Technical Implementation

| Component                  | Responsibility                                                            |
| -------------------------- | ------------------------------------------------------------------------- |
| `components/upload.tsx`    | URL input interface and form submission                                   |
| `actions/transcription.ts` | URL validation, download orchestration, transcription and note generation |
| `lib/media-downloader.ts`  | Direct HTTP/HTTPS media downloading                                       |
| `lib/youtube.ts`           | YouTube URL validation and yt-dlp downloading                             |
| `lib/ffmpeg.ts`            | Audio extraction, compression and temporary-file handling                 |
| `lib/ai.ts`                | AI transcription and text generation                                      |

## 5. Requirements and Security Considerations

- `yt-dlp` is required for YouTube downloads.
- FFmpeg is required for audio processing.
- The server must be able to access the submitted media URL.
- Direct URL downloading should be protected against Server-Side Request Forgery (SSRF).
- Production deployment should enforce download-size limits and validate media content.
- Downloaded files should be cleaned up after processing.

## 6. Future Improvements

Potential improvements include:

- Support for additional media platforms through dedicated integrations.
- Safer URL destination validation and SSRF protection.
- Download-size enforcement.
- Media content-type and file validation.
- Better download progress and error reporting.

These improvements are not represented as currently implemented features.
