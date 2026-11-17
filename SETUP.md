# Lecunity Setup Guide

This guide explains how to configure and run Lecunity locally.

## 1. Prerequisites

Install the following tools:

- **Node.js** — a version compatible with Next.js 15
- **pnpm** — package manager
- **Git** — to clone the repository
- **FFmpeg and FFprobe** — required for audio/video processing
- **yt-dlp** — required for YouTube media downloading
- **AI provider API keys** — required for transcription and AI-generated notes

Verify your installations:

```bash
node --version
pnpm --version
git --version
ffmpeg -version
ffprobe -version
yt-dlp --version
```

## 2. Install System Dependencies

### FFmpeg and FFprobe

**Windows**

1. Install FFmpeg using a trusted Windows package manager or download a build from [ffmpeg.org](https://ffmpeg.org/download.html).
2. Add the FFmpeg `bin` directory to your system PATH.
3. Verify that both `ffmpeg` and `ffprobe` are accessible from the terminal.

**macOS**

```bash
brew install ffmpeg
```

**Ubuntu/Debian**

```bash
sudo apt update
sudo apt install ffmpeg
```

Verify:

```bash
ffmpeg -version
ffprobe -version
```

### yt-dlp

YouTube URL processing requires yt-dlp.

**Windows**

```powershell
winget install yt-dlp
```

**macOS**

```bash
brew install yt-dlp
```

**Ubuntu/Debian**

```bash
sudo apt install yt-dlp
```

Alternatively, install yt-dlp using its official installation instructions:

https://github.com/yt-dlp/yt-dlp#installation

Verify:

```bash
yt-dlp --version
```

## 3. Get AI Provider API Keys

Lecunity uses separate configuration options for speech transcription and text generation.

### Groq

1. Visit [Groq Console](https://console.groq.com/).
2. Sign in or create an account.
3. Generate an API key.
4. Store the key securely.

Groq can be used for transcription and text generation.

### Gemini

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Generate a Gemini API key.
3. Store the key securely.

Gemini is the configured default for text generation.

### Other supported providers

Depending on the task, the application also supports:

- OpenAI
- Deepgram
- Anthropic

Check `.env.example` and the provider configuration before switching providers. Not every provider supports every operation.

## 4. Clone the Repository

```bash
git clone https://github.com/uxasad/Lecunity.git
cd Lecunity
```

## 5. Install Dependencies

```bash
pnpm install
```

## 6. Configure Environment Variables

Create your local environment file.

**Windows PowerShell**

```powershell
Copy-Item .env.example .env.local
```

**macOS/Linux**

```bash
cp .env.example .env.local
```

Open `.env.local` and add your API keys.

### Default configuration

```env
AI_PROVIDER=groq
AI_SUMMARIZATION_PROVIDER=gemini

GROQ_API_KEY=your_groq_api_key
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
GROQ_SUMMARIZATION_MODEL=openai/gpt-oss-20b

GEMINI_API_KEY=your_gemini_api_key
GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
```

The configuration above uses Groq for transcription and Gemini for summarization, translation, and formatting.

### Upload configuration

```env
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,ogg,flac
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov,avi,webm
```

### Application configuration

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional FFmpeg paths

If FFmpeg is not detected automatically, configure its executable paths:

```env
FFMPEG_PATH=/path/to/ffmpeg
FFPROBE_PATH=/path/to/ffprobe
```

On Windows, use the actual paths to your installed executables.

**Important:** Never commit `.env.local` or expose API keys in frontend code, screenshots, or public repositories.

## 7. Run Lecunity Locally

Start the development server:

```bash
pnpm dev
```

Open:

http://localhost:3000

You should see the Lecunity interface.

## 8. Test the Application

Try the following:

1. Upload a short audio file.
2. Upload a supported video file.
3. Test a YouTube URL.
4. Check whether transcription completes.
5. Generate AI notes and verify the selected output language.

Supported output languages:

- English
- Urdu (اردو)
- Roman Urdu

Direct media URLs must point to downloadable audio or video files. Not every website URL is supported.

## 9. Useful Development Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build the application |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Check TypeScript types |
| `pnpm test` | Run tests |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:e2e` | Run Playwright tests |
| `pnpm format` | Format source files |
| `pnpm format:check` | Check formatting |

## 10. Troubleshooting

### FFmpeg or FFprobe not found

**Possible cause:** The executable directory is missing from PATH.

**Solution:**

1. Confirm FFmpeg is installed.
2. Verify `ffmpeg -version` and `ffprobe -version`.
3. Configure `FFMPEG_PATH` and `FFPROBE_PATH` in `.env.local` if automatic detection fails.
4. Restart the development server.

### yt-dlp not found

**Possible cause:** yt-dlp is not installed or is missing from PATH.

**Solution:**

1. Install yt-dlp.
2. Run `yt-dlp --version`.
3. Restart the terminal and development server.

### API key not configured

**Possible cause:** Missing or incorrect environment variables.

**Solution:**

1. Confirm `.env.local` exists in the project root.
2. Check the required API key for the selected provider.
3. Check variable names and values.
4. Restart the development server after changing environment variables.

### Transcription fails

Check:

- Whether the uploaded media format is supported.
- Whether FFmpeg and FFprobe are working.
- Whether the selected transcription provider is configured.
- Whether the API key is valid.
- Whether the provider accepts the media size and duration.

### AI notes generation fails

Check:

- `AI_SUMMARIZATION_PROVIDER`
- The API key for the selected text-generation provider.
- The configured model name.
- Provider API availability and usage limits.

### Port 3000 is already in use

You can start the application on another port:

```bash
pnpm dev -- -p 3001
```

### TypeScript errors

Run:

```bash
pnpm type-check
```

If dependency installation appears corrupted, reinstall dependencies:

```bash
pnpm install
```

## 11. Production and Deployment

Build the application:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

### Docker

The repository includes Docker-related configuration. Before using it, verify that the container image provides the required FFmpeg, FFprobe, and yt-dlp executables and that media processing works inside the container.

### Vercel

The project has Vercel deployment configuration, but successful deployment does not automatically guarantee that all media-processing features work in the hosting environment.

Before deploying, verify:

- Required environment variables are configured.
- Server-side media-processing dependencies are available.
- Upload size and execution-time limits are suitable.
- YouTube processing works in the deployment environment.

## 12. Project Documentation

For further information, see:

- [README.md](README.md) — project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) — system architecture
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) — source code structure
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guidelines
- [CLI-REFERENCE.md](CLI-REFERENCE.md) — development commands

---

**Setup complete:** Lecunity is ready for local development once dependencies, environment variables, and media-processing tools are configured.
