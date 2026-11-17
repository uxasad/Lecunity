# Lecunity — Quick Start

Turn your audio and video lectures into transcripts and structured study notes with AI.

## 1. Requirements

Before running Lecunity, install:

- Node.js
- pnpm
- FFmpeg
- yt-dlp (required for YouTube media downloading)
- API keys for your selected AI providers

## 2. Install dependencies

Open the project directory in your terminal:

```powershell
pnpm install
```

## 3. Configure environment variables

Create a `.env.local` file in the project root.

Example configuration:

```env
# Transcription
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3

# Text generation
AI_SUMMARIZATION_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
```

Get API keys from:

- Groq: https://console.groq.com/keys
- Google AI Studio: https://aistudio.google.com/apikey

Keep your API keys private. Never commit `.env.local` to GitHub.

For additional configuration details, see [GROQ-SETUP.md](GROQ-SETUP.md).

## 4. Run Lecunity

Start the development server:

```powershell
pnpm dev
```

Open:

http://localhost:3000

## 5. Create your first lecture notes

### Upload an audio or video file

1. Open Lecunity.
2. Select a supported audio or video file.
3. Start processing.
4. Wait for transcription and AI note generation.
5. Review the generated transcript and notes.

### Process a YouTube video

1. Select the YouTube input mode.
2. Paste a valid YouTube video URL.
3. Start processing.
4. Review the generated transcript and notes.

YouTube processing requires the appropriate media-download dependencies and a supported video source.

## 6. Output languages

Lecunity currently provides three output language options:

- English
- Urdu (اردو)
- Roman Urdu

The selected language determines the language of the generated content.

## 7. Supported media formats

**Audio:** MP3, WAV, M4A, AAC, OGG, FLAC

**Video:** MP4, MKV, MOV, AVI, WEBM

Actual file acceptance also depends on the configured upload-size limit and validation rules.

## 8. Useful development commands

```powershell
# Start development server
pnpm dev

# Run lint checks
pnpm lint

# Run TypeScript checks
pnpm type-check

# Run tests
pnpm test:run

# Build the application
pnpm build
```

## 9. Troubleshooting

### FFmpeg not found

Install FFmpeg and make sure it is available through your system PATH.

Verify installation:

```powershell
ffmpeg -version
```

### yt-dlp not found

Install yt-dlp and make sure it is available through your system PATH.

Verify installation:

```powershell
yt-dlp --version
```

### API key error

Check that the selected provider's API key is correctly configured in `.env.local`.

Restart the development server after changing environment variables.

### Upload rejected

Check:

- The file format is supported.
- The file does not exceed the configured size limit.
- The file is valid and accessible.

### Port 3000 is already in use

Try another port:

```powershell
$env:PORT=3001
pnpm dev
```

## 10. More documentation

- [README.md](README.md) — Project overview and features
- [GROQ-SETUP.md](GROQ-SETUP.md) — AI provider configuration
- [SETUP.md](SETUP.md) — Detailed installation instructions
- [ARCHITECTURE.md](ARCHITECTURE.md) — Application architecture
- [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) — Project organization
- [TESTING.md](TESTING.md) — Testing instructions
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issues

---

**Lecunity — Turn lectures into structured study notes.**
