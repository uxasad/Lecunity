# Groq Transcription Setup

This guide explains how to configure Groq for audio transcription in Lecunity. Lecunity can use a separate AI provider for text generation, such as Gemini.

## 1. Create API keys

You may need these API keys depending on your selected providers:

- **Groq:** Create an API key at https://console.groq.com/keys
- **Google Gemini:** Create an API key at https://aistudio.google.com/apikey

Keep your API keys private. Never commit them to GitHub or expose them in client-side code.

## 2. Configure environment variables

Open your `.env.local` file in the project root and configure the providers:

```env
# Transcription
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3

# Text generation and summarization
AI_SUMMARIZATION_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_SUMMARIZATION_MODEL=gemini-3.6-flash
```

Replace the placeholder values with your own API keys.

Do not share your `.env.local` file or upload it to GitHub.

## 3. Provider configuration

Lecunity uses two separate provider settings:

| Variable                    | Purpose                                        |
| --------------------------- | ---------------------------------------------- |
| `AI_PROVIDER`               | Audio transcription                            |
| `AI_SUMMARIZATION_PROVIDER` | Summarization, translation and text formatting |

This separation allows Groq to handle transcription while Gemini handles text generation.

If `AI_SUMMARIZATION_PROVIDER` is not set, the application falls back to `AI_PROVIDER`, then to its configured default.

## 4. Supported output languages

Lecunity currently provides three output language options:

- English
- Urdu (اردو)
- Roman Urdu

The selected language controls the generated content. It does not require the original audio to be in that language.

## 5. Run and test the application

After saving your environment variables:

```powershell
pnpm dev
```

Then:

1. Open `http://localhost:3000`.
2. Upload a supported audio or video file.
3. Start transcription.
4. Check the generated transcript and notes.
5. Test the available output language options.

## 6. Troubleshooting

**Missing Groq API key**

Check that `GROQ_API_KEY` is present in `.env.local`.

**Missing Gemini API key**

If Gemini is selected for summarization, check that `GEMINI_API_KEY` is configured.

**Provider changes are not taking effect**

Restart the development server after changing environment variables.

**Transcription fails**

Check the API key, selected model, supported file format, file size and provider response.

**Summarization fails**

Check the selected summarization provider, its API key and the configured model.

## 7. Official documentation

- Groq API documentation: https://console.groq.com/docs
- Groq API keys: https://console.groq.com/keys
- Google AI Studio: https://aistudio.google.com/
- Gemini API documentation: https://ai.google.dev/gemini-api/docs
- Gemini API keys: https://aistudio.google.com/apikey
