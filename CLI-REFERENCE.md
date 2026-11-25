# Lecunity CLI Reference

This guide contains the commands used to install, configure, develop, test, and maintain Lecunity.

## 1. Prerequisites

Install the following tools before starting:

- **Node.js:** Compatible with the installed Next.js version.
- **pnpm:** Package manager.
- **Git:** Version control.
- **FFmpeg and FFprobe:** Required for audio and video processing.
- **yt-dlp:** Required for YouTube media downloading.

Verify installations:

```bash
node --version
pnpm --version
git --version
ffmpeg -version
ffprobe -version
yt-dlp --version
```

## 2. Clone and Install

```bash
git clone https://github.com/uxasad/Lecunity.git
cd Lecunity
pnpm install
```

Create your environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

**macOS/Linux:**

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys.

Start the development server:

```bash
pnpm dev
```

Open http://localhost:3000.

## 3. Environment Configuration

### AI Provider Settings

```env
AI_PROVIDER=groq
AI_SUMMARIZATION_PROVIDER=gemini

GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

GROQ_TRANSCRIPTION_MODEL=whisper-large-v3
GROQ_SUMMARIZATION_MODEL=openai/gpt-oss-20b
GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
```

`AI_PROVIDER` controls speech transcription.

`AI_SUMMARIZATION_PROVIDER` controls translation, formatting, and summarization. If it is not configured, the application falls back to `AI_PROVIDER`.

### Alternative Providers

The application also supports these providers:

| Provider  | Purpose                           |
| --------- | --------------------------------- |
| OpenAI    | Transcription and text generation |
| Groq      | Transcription and text generation |
| Deepgram  | Transcription                     |
| Gemini    | Text generation                   |
| Anthropic | Text generation and summarization |

Configure the relevant provider API key and model settings when using an alternative provider.

### Upload Settings

```env
MAX_FILE_SIZE_MB=100
ALLOWED_AUDIO_FORMATS=mp3,wav,m4a,aac,ogg,flac
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov,avi,webm
```

### Application Settings

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### FFmpeg Configuration

FFmpeg and FFprobe are automatically detected when possible.

If automatic detection fails, configure their paths:

```env
FFMPEG_PATH=/path/to/ffmpeg
FFPROBE_PATH=/path/to/ffprobe
```

Windows example:

```env
FFMPEG_PATH=C:/ffmpeg/bin/ffmpeg.exe
FFPROBE_PATH=C:/ffmpeg/bin/ffprobe.exe
```

Never commit `.env.local` or other files containing API keys.

## 4. Development Commands

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `pnpm dev`          | Start development server     |
| `pnpm build`        | Build production application |
| `pnpm start`        | Start production server      |
| `pnpm lint`         | Run ESLint                   |
| `pnpm type-check`   | Check TypeScript types       |
| `pnpm format`       | Format supported files       |
| `pnpm format:check` | Check formatting             |

## 5. Testing Commands

### Unit and Integration Tests

```bash
pnpm test
```

Run all tests once:

```bash
pnpm test:run
```

Open the Vitest interface:

```bash
pnpm test:ui
```

Generate test coverage:

```bash
pnpm test:coverage
```

### End-to-End Tests

```bash
pnpm test:e2e
```

Other available commands:

```bash
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:chromium
pnpm test:e2e:debug
```

## 6. FFmpeg Utility Commands

Check FFmpeg availability:

```bash
pnpm check:ffmpeg
```

Search for FFmpeg installations:

```bash
pnpm find:ffmpeg
```

These scripts use Bash, so Windows users should run them through a compatible Bash environment.

## 7. Production Build

Check types and run tests before building:

```bash
pnpm type-check
pnpm test:run
pnpm build
```

Start the production server:

```bash
pnpm start
```

The default local production address is http://localhost:3000.

## 8. Docker Commands

If Docker is installed and the project Docker configuration is available:

Build the image:

```bash
docker build -t lecunity .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env.local lecunity
```

For Docker Compose:

```bash
docker compose up --build
```

Stop Compose services:

```bash
docker compose down
```

Media processing requires compatible FFmpeg and yt-dlp binaries in the runtime environment. A successful Docker image build alone does not verify those dependencies.

## 9. Git Workflow

Create a feature branch:

```bash
git checkout -b feat/feature-name
```

Create a bug-fix branch:

```bash
git checkout -b fix/bug-name
```

Check repository status:

```bash
git status
```

Review recent commits:

```bash
git log --oneline -5
```

Stage and commit changes:

```bash
git add .
git commit -m "feat: describe your change"
```

Push changes:

```bash
git push origin main
```

## 10. Troubleshooting Commands

Check installed dependencies:

```bash
pnpm list
```

Check TypeScript errors:

```bash
pnpm type-check
```

Remove generated Next.js build output:

**Windows PowerShell:**

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

**macOS/Linux:**

```bash
rm -rf .next
```

Reinstall dependencies:

```bash
pnpm install
```

Check whether the required media tools are available:

```bash
ffmpeg -version
ffprobe -version
yt-dlp --version
```

If media processing fails, verify the API keys, provider configuration, file format, upload size, and media-processing dependencies.

## 11. Deployment Notes

Lecunity includes configuration prepared for Vercel deployment.

Before deploying:

1. Connect the GitHub repository to Vercel.
2. Configure the required AI provider environment variables.
3. Verify the production build.
4. Check whether the hosting runtime supports the required FFmpeg and yt-dlp processing workflows.
5. Test actual audio, video, and URL processing after deployment.

Deployment configuration does not guarantee that every media-processing feature will work in every serverless environment.

## Related Documentation

- [README](README.md)
- [Quick Start](QUICKSTART.md)
- [Setup Guide](SETUP.md)
- [Architecture](ARCHITECTURE.md)
- [Project Structure](PROJECT-STRUCTURE.md)
- [Testing](TESTING.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [File Security](FILE-SECURITY.md)
- [Rate Limits](RATE-LIMITS.md)

---

Repository: https://github.com/uxasad/Lecunity
