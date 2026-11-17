# Troubleshooting

This guide covers common setup, media-processing, transcription, AI-generation, and deployment issues in Lecunity.

## 1. Application Does Not Start

### Check Node.js and pnpm

```powershell
node --version
pnpm --version
```

If either command is unavailable, install the required tool and reopen your terminal.

### Install dependencies

From the project directory:

```powershell
pnpm install
```

Then start the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000`.

If the application still does not start, check the terminal output for the first reported error.

## 2. Environment Variables or API Key Errors

Lecunity uses separate configuration settings for transcription and text generation.

Default configuration:

| Purpose | Environment variable | Default |
|---|---|---|
| Transcription provider | `AI_PROVIDER` | `groq` |
| Text-generation provider | `AI_SUMMARIZATION_PROVIDER` | `gemini` |
| Groq transcription model | `GROQ_TRANSCRIPTION_MODEL` | `whisper-large-v3` |
| Gemini generation model | `GEMINI_SUMMARIZATION_MODEL` | `gemini-3.6-flash` |

The corresponding API keys must be configured:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Common configuration problems

- **API key not configured:** Check that the required key exists in `.env.local`.
- **Invalid API key:** Verify the key with its provider.
- **Wrong provider:** Check `AI_PROVIDER` and `AI_SUMMARIZATION_PROVIDER`.
- **Changes not applied:** Restart the development server after changing environment variables.

Keep `.env.local` private. Never commit real API keys to GitHub or expose them in frontend code.

For provider-specific setup, see [GROQ-SETUP.md](./GROQ-SETUP.md).

## 3. FFmpeg or FFprobe Errors

FFmpeg and FFprobe are required for media processing.

Lecunity uses them to extract and prepare audio from uploaded video and other media sources.

### Check installation

On Windows, run:

```powershell
ffmpeg -version
ffprobe -version
```

If either command is not recognized, install FFmpeg and make sure its `bin` directory is included in your system PATH.

You can also check command availability:

```powershell
Get-Command ffmpeg, ffprobe
```

### Configure custom paths

If automatic detection does not find the executables, add their paths to `.env.local`:

```env
FFMPEG_PATH=C:\path\to\ffmpeg.exe
FFPROBE_PATH=C:\path\to\ffprobe.exe
```

Replace the example paths with the actual locations on your computer.

Restart the application after changing these values.

### YouTube processing errors

YouTube media downloading also depends on `yt-dlp`.

Check whether it is available:

```powershell
yt-dlp --version
```

If it is missing, install it and make sure it is accessible through PATH.

A YouTube download can still fail because of network restrictions, unavailable videos, or changes to YouTube.

## 4. Audio or Video Upload Problems

### File rejected

Check the following:

- The file uses a supported audio or video format.
- The file extension and MIME type are valid.
- The file does not exceed the configured upload limit.
- The file is not empty or corrupted.

The general upload limit is controlled by:

```env
MAX_FILE_SIZE_MB=100
```

The application also has a separate Next.js Server Action request-body limit configured to 100 MB.

Actual upload success can depend on both application validation and deployment-platform limits.

### Video upload fails during audio extraction

Video files require FFmpeg to extract their audio.

Try the following:

1. Confirm FFmpeg and FFprobe work.
2. Test with a smaller video.
3. Check whether the video file plays correctly.
4. Inspect the terminal logs for FFmpeg errors.

### Audio file is too large

The uploaded-file processing path does not automatically compress every uploaded audio file.

For URL and YouTube processing, audio larger than 24 MB is passed through the compression function.

Do not assume that compression will always produce a file below the target size.

## 5. Transcription Problems

Lecunity prepares audio as mono, 16 kHz, 64 kbps MP3 and splits it into sequential chunks of approximately 10 minutes.

Each chunk is sent to the configured transcription provider.

### Transcription fails

Check:

- The configured transcription provider.
- The provider API key.
- The provider's current service status and usage limits.
- FFmpeg audio preparation logs.
- Whether the original media file is valid.

The application currently supports Groq, OpenAI, and Deepgram transcription configurations.

### Only part of a long recording is processed

Check the terminal logs for chunk-processing messages.

The application processes chunks sequentially. A failure in a chunk can interrupt the overall transcription operation.

### Transcription language is incorrect

Speech recognition detects the spoken language. The selected output language is a separate setting used for transcript translation and formatting.

Check the selected output language if the transcript is translated into an unexpected language.

## 6. Translation, Formatting, or Summary Errors

Text generation uses the provider configured through `AI_SUMMARIZATION_PROVIDER`.

Supported text-generation configurations include Groq, Gemini, and OpenAI. Anthropic is supported for summarization.

### Generation fails

Check:

1. The selected text-generation provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.

Lecunity uses retry handling for configured text-generation operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.

This retry behavior should not be assumed to apply to transcription requests.

## 7. YouTube or Direct URL Errors

Lecunity supports YouTube URLs and direct HTTP/HTTPS media download URLs.

A normal webpage URL is not necessarily a direct media download URL.

For example, a webpage containing an embedded video may not expose a downloadable audio or video file.

If a URL fails:

- Check that it is publicly accessible.
- Confirm that it points to supported media.
- Check whether the source requires authentication.
- Try a direct media URL instead of a webpage link.
- Check the terminal logs for download errors.

Support for every video-sharing platform is not guaranteed.

## 8. Build or TypeScript Errors

Run the following checks:

```powershell
pnpm type-check
pnpm lint
```

If dependencies or generated build files appear corrupted, try:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm install
pnpm dev
```

For a production build, run:

```powershell
pnpm build
```

Resolve the first build error before investigating later errors.

## 9. Deployment Problems

A successful local run does not guarantee that deployment will work.

Check:

- All required environment variables are configured in the deployment environment.
- The deployment platform supports the required media-processing dependencies.
- FFmpeg, FFprobe, and yt-dlp are available where required.
- Upload-size and execution-time limits are compatible with the processing workflow.
- API keys are stored as server-side environment variables.

The project uses Next.js standalone output. Deployment compatibility still depends on the hosting platform and its runtime configuration.

## 10. Useful Commands

| Task | Command |
|---|---|
| Install dependencies | `pnpm install` |
| Start development server | `pnpm dev` |
| Run type checking | `pnpm type-check` |
| Run linting | `pnpm lint` |
| Run unit and integration tests | `pnpm test:run` |
| Run end-to-end tests | `pnpm test:e2e` |
| Create production build | `pnpm build` |
| Start production server | `pnpm start` |
| Check FFmpeg setup | `pnpm check:ffmpeg` |
| Find FFmpeg binaries | `pnpm find:ffmpeg` |

## 11. Reporting an Issue

If a problem continues, collect:

- The exact error message.
- The operation that failed.
- The media format and approximate file size.
- The configured provider (never share its API key).
- Relevant terminal logs.
- Steps needed to reproduce the problem.

Remove API keys, personal information, and private media URLs before sharing logs.

---

For additional technical details, see [README.md](./README.md), [SETUP.md](./SETUP.md), [ARCHITECTURE.md](./ARCHITECTURE.md), and [GROQ-SETUP.md](./GROQ-SETUP.md).
# Troubleshooting

## 1. Transcription Errors

### Transcription fails

Check:

1. The selected transcription provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.

Lecunity uses retry handling for configured transcription operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to text-generation requests.

## 2. Summarization Errors

### Summarization fails

Check:

1. The selected summarization provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.
Lecunity uses retry handling for configured summarization operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to transcription requests.

## 3. Text-to-Speech Errors

### Text-to-Speech fails

Check:

1. The selected text-to-speech provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.
Lecunity uses retry handling for configured text-to-speech operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to summarization requests.

## 4. Media Processing Errors

### Media processing fails

Check:

1. The selected media-processing provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.

5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.
Lecunity uses retry handling for configured media-processing operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to text-to-speech requests.

## 5. File Upload Errors

### File upload fails

Check:

1. The selected file-upload provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.
Lecunity uses retry handling for configured file-upload operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to media-processing requests.

## 6. File Download Errors

### File download fails

Check:

1. The selected file-download provider.
2. The corresponding API key.
3. The model name configured in `.env.local`.
4. Provider usage limits and service availability.
5. The terminal logs for the actual error.

### Rate-limit errors

Providers may reject requests when usage limits are reached.
Lecunity uses retry handling for configured file-download operations. Its retry configuration allows five retries, uses exponential backoff, and can respect a provider-supplied `Retry-After` value for HTTP 429 errors.
This retry behavior should not be assumed to apply to file-upload requests.

## 7. Other Errors

### Server errors

Check:

1. The terminal logs for the actual error.
2. The server logs for the actual error.

### Client errors

Check:

1. The terminal logs for the actual error.
2. The client logs for the actual error.
3. The request body for the actual error.
4. The response body for the actual error.
5. The request headers for the actual error.
6. The response headers for the actual error.
7. The request method for the actual error.
8. The response status code for the actual error.
9. The response status text for the actual error.
10. The response content type for the actual error.
11. The response content length for the actual error.
12. The response content encoding for the actual error.
13. The response content language for the actual error.
14. The response content location for the actual error.
15. The response content range for the actual error.
16. The response content disposition for the actual error.
17. The response content transfer encoding for the actual error.
18. The response content md5 for the actual error.
19. The response content sha1 for the actual error.
20. The response content sha256 for the actual error.
21. The response content sha512 for the actual error.
22. The response content charset for the actual error.
23. The response content base64 for the actual error.
24. The response content gzip for the actual error.
25. The response content deflate for the actual error.
26. The response content br for the actual error.
27. The response content identity for the actual error.
28. The response content x-gzip for the actual error.
29. The response content x-deflate for the actual error.
30. The response content x-br for the actual error.
31. The response content x-identity for the actual error.
32. The response content x-gzip-identity for the actual error.
33. The response content x-deflate-identity for the actual error.
34. The response content x-br-identity for the actual error.
35. The response content x-identity-identity for the actual error.
36. The response content x-gzip-identity-identity for the actual error.
37. The response content x-deflate-identity-identity for the actual error.
38. The response content x-br-identity-identity for the actual error.
39. The response content x-identity-identity-identity for the actual error.
40. The response content x-gzip-identity-identity-identity for the actual error.
41. The response content x-deflate-identity-identity-identity for the actual error.
42. The response content x-br-identity-identity-identity for the actual error.
43. The response content x-identity-identity-identity-identity for the actual error.
44. The response content x-gzip-identity-identity-identity-identity for the actual error.
45. The response content x-deflate-identity-identity-identity-identity for the actual error.
46. The response content x-br-identity-identity-identity-identity for the actual error.
47. The response content x-identity-identity-identity-identity-identity for the actual error.
48. The response content x-gzip-identity-identity-identity-identity-identity for the actual error.
49. The response content x-deflate-identity-identity-identity-identity-identity for the actual error.
50. The response content x-br-identity-identity-identity-identity-identity for the actual error.
51. The response content x-identity-identity-identity-identity-identity-identity for the actual error.
52. The response content x-gzip-identity-identity-identity-identity-identity-identity for the actual error.
53. The response content x-deflate-identity-identity-identity-identity-identity-identity for the actual error.
54. The response content x-br-identity-identity-identity-identity-identity-identity for the actual error.
55. The response content x-identity-identity-identity-identity-identity-identity-identity for the actual error.
56. The response content x-gzip-identity-identity-identity-identity-identity-identity-identity for the actual error.
57. The response content x-deflate-identity-identity-identity-identity-identity-identity-identity for the actual error.