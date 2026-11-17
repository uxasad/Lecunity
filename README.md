# Lecunity 🎓

**Turn lectures into clear, structured study notes with AI.**

Lecunity is an AI-powered learning assistant that helps students convert audio and video lectures into readable transcripts, summaries, and organized study notes.

Instead of spending hours manually reviewing long lectures, students can upload their learning material and let AI help them understand and organize the content.

## ✨ Key Features

- **Audio Upload:** Upload audio files for transcription and note generation.
- **Video Upload:** Extract audio from video files and process the lecture.
- **YouTube Support:** Submit a YouTube video URL for processing.
- **AI Transcription:** Convert spoken lecture content into text using AI.
- **AI-Generated Notes:** Transform transcripts into structured and readable study notes.
- **Summarization:** Get concise summaries of lecture content.
- **Multilingual Output:** Generate content in three languages:
  - English
  - Urdu (اردو)
  - Roman Urdu
- **Transcript Viewing:** Review the generated lecture transcript.
- **Modern Interface:** Use a responsive and student-friendly web interface.

## 🎯 Our Goal

Lecunity aims to make learning more efficient and accessible by reducing the time students spend manually processing lecture material.

Our goal is to help students focus less on organizing information and more on understanding it.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 15 | Full-stack web framework |
| React 19 | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| Groq API | AI processing |
| Whisper Large V3 | Audio transcription |
| GPT-OSS-20B | AI summarization |
| FFmpeg | Audio extraction and processing |
| yt-dlp | YouTube media processing |
| pnpm | Package management |

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- Node.js 22 or a compatible supported version
- pnpm
- FFmpeg
- yt-dlp (required for YouTube processing)
- A Groq API key

### 1. Clone the Repository

```bash
git clone https://github.com/uxasad/Lecunity.git
cd Lecunity
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root.

Add your Groq API key:

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
```

Never commit your actual API key to GitHub.

Get your API key from [Groq Console](https://console.groq.com/keys).

### 4. Install FFmpeg

FFmpeg is used for audio extraction and media processing.

**Windows:** Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html).

**macOS:**

```bash
brew install ffmpeg
```

**Ubuntu/Debian:**

```bash
sudo apt install ffmpeg
```

For YouTube processing, install [yt-dlp](https://github.com/yt-dlp/yt-dlp) as well.

### 5. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use Lecunity

1. Open the Lecunity application.
2. Select your lecture input method.
3. Upload an audio or video file, or provide a supported YouTube URL.
4. Start processing.
5. Wait for AI transcription and summarization.
6. Review your transcript and generated study notes.
7. Select your preferred output language.

## 🧪 Development & Testing

Run the following commands during development.

**Run tests:**

```bash
pnpm test:run
```

**Type checking:**

```bash
pnpm type-check
```

**Linting:**

```bash
pnpm lint
```

**Build the application:**

```bash
pnpm build
```

## 🗺️ Project Roadmap

The following features are planned for future development:

- [ ] PDF, DOCX, and PPTX document processing
- [ ] AI-powered lecture explanations
- [ ] Interactive AI study assistant
- [ ] Automatic quiz generation
- [ ] Flashcards for revision
- [ ] Mind maps and visual learning tools
- [ ] Timestamp-based references
- [ ] Improved support for additional media platforms
- [ ] User accounts and cloud-based study history

## 🔐 Security & Privacy

- API keys should be stored in environment variables.
- Uploaded files should be validated before processing.
- Do not expose secret credentials in client-side code.
- Do not commit `.env.local` or other files containing secrets.

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📬 Contact & Support

- **GitHub Repository:** https://github.com/uxasad/Lecunity
- **Issues:** https://github.com/uxasad/Lecunity/issues

---

**Lecunity — Learn smarter, not harder.** 🎓
