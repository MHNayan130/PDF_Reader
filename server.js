require('dotenv').config();
const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');
const multer = require('multer');
const app = express();

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /audio\/(mpeg|wav|flac|m4a|mp4)/;
    const allowedExt = /\.(mp3|wav|flac|m4a|mp4)$/i;

    if (allowedTypes.test(file.mimetype) || allowedExt.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Initialize OpenAI client with HuggingFace
const client = new OpenAI({
  baseURL: 'https://router.huggingface.co/v1',
  apiKey: process.env.HF_TOKEN,
});

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Default to DeepSeek if no model specified
    const chatModel = model || 'deepseek-ai/DeepSeek-V3:novita';

    const completion = await client.chat.completions.create({
      model: chatModel,
      messages: [{ role: 'user', content: message }],
      max_tokens: 1024,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Summary endpoint
app.post('/api/summary', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const completion = await client.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3:novita',
      messages: [
        {
          role: 'user',
          content: `Please provide a concise summary of the following text:\n\n${text}`,
        },
      ],
      max_tokens: 512,
    });

    res.json({ summary: completion.choices[0].message.content });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Read (analyze document) endpoint
app.post('/api/read', async (req, res) => {
  try {
    const { text, question } = req.body;
    if (!text || !question) {
      return res.status(400).json({ error: 'Text and question are required' });
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3:novita',
      messages: [
        {
          role: 'user',
          content: `Based on the following document, answer this question:\n\nDocument:\n${text}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 1024,
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (error) {
    console.error('Read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Text-to-speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    // For now, using mock response since direct TTS integration requires additional setup
    // In production, you'd use OpenAI TTS API or HuggingFace TTS models
    const mockAudioBase64 = Buffer.from('mock_audio_data').toString('base64');

    res.json({
      audio: mockAudioBase64,
      format: 'mp3',
      voice: voice,
      speed: speed
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, fromLang, toLang } = req.body;
    if (!text || !fromLang || !toLang) {
      return res.status(400).json({ error: 'Text, source language, and target language are required' });
    }

    const completion = await client.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3:novita',
      messages: [
        {
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Provide only the translated text without any additional comments or explanations:\n\n${text}`,
        },
      ],
      max_tokens: 1024,
    });

    res.json({ translation: completion.choices[0].message.content });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AnyStudy server is running at http://localhost:${port}`);
});
