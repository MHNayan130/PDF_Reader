# AI Features Folder

This folder contains all AI-powered study tools for AnyStudy.

## Structure

### Pages (HTML)
- `chat.html` - AI Chat Assistant interface
- `read.html` - Document reading and analysis tool
- `summary.html` - Text summarization tool
- `pdf-doc.html` - PDF/Doc generation tool
- `speech.html` - Speech-to-text transcription tool
- `tts.html` - Text-to-speech synthesis tool
- `translate.html` - AI language translation tool

### Scripts (JavaScript)
- `chat.js` - Chat functionality and API integration
- `read.js` - Document analysis and Q&A
- `summary.js` - Text summarization processing
- `pdf-doc.js` - Document generation and download
- `speech.js` - Audio file upload and transcription
- `tts.js` - Text-to-speech synthesis and playback
- `translate.js` - Language translation functionality

## API Endpoints

All AI features use the following backend endpoints:
- `POST /api/chat` - Chat with AI models
- `POST /api/summary` - Generate text summaries
- `POST /api/read` - Analyze documents and answer questions
- `POST /api/generate-doc` - Create PDF/Doc files
- `POST /api/speech-to-text` - Transcribe audio files
- `POST /api/text-to-speech` - Convert text to speech
- `POST /api/translate` - Translate text between languages

## Models Used

- **DeepSeek-V3** (via HuggingFace) - Default chat model, summary, and analysis
- **Qwen 2.5 72B** (via HuggingFace) - Alternative chat model with different capabilities
- **Whisper Large V3** (via HuggingFace) - Speech-to-text transcription
- **Web Speech API** + **OpenAI TTS** (via HuggingFace) - Text-to-speech synthesis

## Features

### AI Translation
- **Multi-language Support**: 12 major world languages (English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Russian, Arabic, Hindi)
- **Language Swap**: Easy language swapping with one click
- **Character Limit**: Up to 5000 characters per translation
- **Copy Function**: Copy translated text to clipboard
- **Real-time Count**: Character counter for input text
- **Keyboard Shortcut**: Ctrl+Enter to translate quickly

### AI Chat Assistant
- **Multiple Models**: Choose between DeepSeek V3 (default) and Qwen 2.5 72B
- **Real-time Responses**: Instant AI-powered conversations
- **Model Selection**: Switch between different AI models for varied responses
- **Persistent Chat**: Conversations maintained during session

## Configuration

Set your HuggingFace API token in the `.env` file:
```
HF_TOKEN=your_huggingface_token_here
```