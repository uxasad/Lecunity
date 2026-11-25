# Lecunity

**Turn lectures into structured study notes with AI.**

Lecunity is an AI-powered learning application that transforms audio and video lectures into transcripts, summaries, and structured study notes.

The goal is to make educational content easier to understand, review, and study.

## Features

- **Audio Upload:** Upload supported audio files for transcription.
- **Video Upload:** Upload supported video files and extract their audio for processing.
- **YouTube Support:** Process supported YouTube video URLs.
- **AI Transcription:** Convert speech into text using AI.
- **AI-Generated Notes:** Generate structured study notes from transcripts.
- **Summarization:** Create concise summaries of lecture content.
- **Language Options:** Generate content in English, Urdu (اردو), and Roman Urdu.
- **Transcript and Notes:** View the processed transcript and generated study material.
- **Browser History:** Access previously processed results stored in browser storage.

## Technology Stack

| Technology       | Purpose                            |
| ---------------- | ---------------------------------- |
| Next.js 15       | Application framework              |
| React 19         | User interface                     |
| TypeScript       | Type-safe development              |
| Tailwind CSS     | Styling                            |
| Groq API         | AI transcription and summarization |
| Whisper Large V3 | Speech-to-text transcription       |
| GPT-OSS-20B      | AI summarization                   |
| FFmpeg           | Audio and video processing         |
| yt-dlp           | YouTube media retrieval            |
| pnpm             | Package management                 |

## How It Works

1. Upload an audio/video file or provide a supported YouTube URL.
2. The application extracts audio when required.
3. The audio is sent to the transcription model.
4. The resulting transcript is processed by the AI summarization model.
5. Lecunity generates structured study notes.
6. Review the transcript and generated notes.

## Supported Output Languages

Lecunity currently provides three output language options:

- **English:** Standard English.
- **Urdu:** Urdu written in Urdu script.
- **Roman Urdu:** Urdu written using the English alphabet.

## Getting Started

### Prerequisites

Install the following tools:

- Node.js 18.18 or later
- pnpm
- FFmpeg
- yt-dlp (required for YouTube processing)
- A Groq API key

### 1. Clone the repository

```bash
git clone https://github.com/uxasad/Lecunity.git
cd Lecunity
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
```

Do not commit API keys or other secrets to GitHub.

### 4. Start the development server

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Available Commands

| Command              | Description              |
| -------------------- | ------------------------ |
| `pnpm dev`           | Start development server |
| `pnpm build`         | Build the application    |
| `pnpm start`         | Start production server  |
| `pnpm lint`          | Run lint checks          |
| `pnpm type-check`    | Check TypeScript types   |
| `pnpm test`          | Run tests                |
| `pnpm test:run`      | Run tests once           |
| `pnpm test:coverage` | Run tests with coverage  |

## Project Structure

```text
Lecunity/
â”œâ”€â”€ actions/          # Server-side application actions
â”œâ”€â”€ app/              # Next.js App Router
â”œâ”€â”€ components/       # React components
â”œâ”€â”€ lib/              # AI, media, and application utilities
â”œâ”€â”€ public/            # Static assets
â”œâ”€â”€ scripts/           # Utility scripts
â”œâ”€â”€ tests/             # Automated tests
â”œâ”€â”€ types/             # TypeScript definitions
â”œâ”€â”€ utils/             # Shared utility functions
â”œâ”€â”€ package.json
â”œâ”€â”€ pnpm-lock.yaml
â””â”€â”€ README.md
```

## Deployment

Lecunity is being prepared for public deployment.

The application uses media-processing tools such as FFmpeg and yt-dlp. Deployment environments must support the required processing dependencies, execution time, file handling, and resource limits.

**Important:** Standard serverless deployment environments may impose restrictions on media processing. Verify compatibility before relying on audio/video processing in production.

Docker configuration is also available for self-hosted deployment.

## Security

- API keys should be stored in environment variables.
- Never expose private API keys in client-side code.
- Uploaded files should be validated before processing.
- Temporary media files should be handled securely.

## Current Development Status

Lecunity is an actively developed project. Its initial focus is the core lecture-processing workflow:

**Audio/Video â†’ Transcription â†’ AI Summarization â†’ Study Notes**

Additional learning features may be introduced in future development phases.

## Contributing

Contributions, suggestions, and bug reports are welcome.

Please open an issue or submit a pull request through the GitHub repository.

## Repository

- **GitHub:** https://github.com/uxasad/Lecunity
- **Issues:** https://github.com/uxasad/Lecunity/issues

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

**Lecunity â€” Learn better, understand deeper.**
