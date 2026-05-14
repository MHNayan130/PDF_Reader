async function bindTTSPage() {
  const ttsInput = document.getElementById('ttsInput');
  const voiceSelect = document.getElementById('voiceSelect');
  const speedSelect = document.getElementById('speedSelect');
  const speakBtn = document.getElementById('speakBtn');
  const audioPlayer = document.getElementById('audioPlayer');
  const ttsAudio = document.getElementById('ttsAudio');
  const downloadBtn = document.getElementById('downloadBtn');
  const ttsStatus = document.getElementById('ttsStatus');
  const loadExistingTtsFileBtn = document.getElementById('loadExistingTtsFileBtn');
  const uploadTtsFileBtn = document.getElementById('uploadTtsFileBtn');
  const ttsDocInput = document.getElementById('ttsDocInput');

  loadProfileImage();
  bindPopupMenu();

  // Document file loading handlers
  if (loadExistingTtsFileBtn) {
    loadExistingTtsFileBtn.addEventListener('click', showLoadFileDialog);
  }

  if (uploadTtsFileBtn && ttsDocInput) {
    uploadTtsFileBtn.addEventListener('click', () => ttsDocInput.click());
    ttsDocInput.addEventListener('change', handleTtsDocUpload);
  }

  let currentAudioBlob = null;
  let isWebSpeechSupported = 'speechSynthesis' in window;

  // Web Speech API voices
  let voices = [];
  const voiceMap = {
    alloy: ['alloy', 'google us english', 'samantha', 'karen', 'victoria'],
    echo: ['echo', 'david', 'matthew', 'mark', 'male', 'google uk english'],
    fable: ['fable', 'english', 'brit', 'uk', 'serena', 'linda', 'hazel'],
    onyx: ['onyx', 'deep', 'bruce', 'stefan', 'male'],
    nova: ['nova', 'female', 'samantha', 'karen', 'victoria'],
    shimmer: ['shimmer', 'female', 'zira', 'alloy']
  };

  function handleTtsDocUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      ttsInput.value = event.target.result;
      updateSelectedFileInfo('ttsDocInput', 'selectedTtsFileInfo', 'selectedTtsFileName');
    };
    reader.readAsText(file);
  }

  function showLoadFileDialog() {
    alert('Load existing file feature - you can implement a file browser here.');
  }

  function updateSelectedFileInfo(inputId, containerID, spanId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerID);
    const span = document.getElementById(spanId);

    if (input && container && span && input.files.length > 0) {
      span.textContent = input.files[0].name;
      container.style.display = 'block';
    } else if (container) {
      container.style.display = 'none';
    }
  }

  function loadVoices() {
    voices = speechSynthesis.getVoices();
  }

  function getVoiceForSelection(voiceKey) {
    if (!voices.length) return null;
    const candidates = voiceMap[voiceKey] || [voiceKey];
    for (const candidate of candidates) {
      const normalized = candidate.toLowerCase();
      const matched = voices.find((voice) =>
        voice.name.toLowerCase().includes(normalized) ||
        (voice.lang || '').toLowerCase().includes(normalized)
      );
      if (matched) return matched;
    }
    return voices[0];
  }

  if (isWebSpeechSupported) {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  function updateStatus(message, isError = false) {
    ttsStatus.innerHTML = `<p style="color: ${isError ? '#ff6b6b' : '#e9f0ff'};">${escapeHtml(message)}</p>`;
  }

  function showAudioPlayer(audioUrl, blob) {
    currentAudioBlob = blob;
    ttsAudio.src = audioUrl;
    audioPlayer.style.display = 'block';
    updateStatus('Audio generated successfully! Use the player above to listen.');
  }

  // Web Speech API implementation (immediate functionality)
  async function speakWithWebAPI(text, voiceName, speed) {
    return new Promise((resolve, reject) => {
      if (!isWebSpeechSupported) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1;

      // Try to find a matching voice
      const selectedVoice = getVoiceForSelection(voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = Math.min(2.0, Math.max(0.5, parseFloat(speed) || 1));
      utterance.pitch = 1;

      utterance.onstart = () => updateStatus('Speaking...');
      utterance.onend = () => {
        updateStatus('Speech completed.');
        resolve();
      };
      utterance.onerror = (event) => {
        updateStatus(`Speech error: ${event.error}`, true);
        reject(new Error(event.error));
      };

      speechSynthesis.speak(utterance);
    });
  }

  // HuggingFace TTS API implementation (for better quality)
  async function generateWithHuggingFace(text, voice, speed) {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');
      const data = await response.json();

      // Convert base64 to blob
      const audioBlob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      showAudioPlayer(audioUrl, audioBlob);
    } catch (error) {
      console.error('HuggingFace TTS error:', error);
      // Fallback to Web Speech API
      await speakWithWebAPI(text, voice, speed);
    }
  }

  if (speakBtn) {
    speakBtn.addEventListener('click', async () => {
      const text = ttsInput.value.trim();
      const voice = voiceSelect.value;
      const speed = speedSelect.value;

      if (!text) {
        updateStatus('Please enter some text to speak.', true);
        return;
      }

      if (text.length > 4000) {
        updateStatus('Text is too long. Please limit to 4000 characters.', true);
        return;
      }

      speakBtn.disabled = true;
      speakBtn.textContent = 'Speaking...';
      audioPlayer.style.display = 'none';
      currentAudioBlob = null;

      try {
        if (isWebSpeechSupported) {
          await speakWithWebAPI(text, voice, speed);
        } else {
          await generateWithHuggingFace(text, voice, speed);
        }
      } catch (error) {
        updateStatus(`Error: ${error.message}`, true);
      } finally {
        speakBtn.disabled = false;
        speakBtn.textContent = '🔊 Speak Text';
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!currentAudioBlob) return;

      const url = URL.createObjectURL(currentAudioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anystudy-speech-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateStatus('Audio file downloaded!');
    });
  }

  // Initialize with Web Speech API availability check
  if (!isWebSpeechSupported) {
    updateStatus('⚠️ Web Speech API not supported. Using server-side TTS only.');
  } else {
    updateStatus('Ready to convert text to speech! Choose a voice and speed, then click "Speak Text".');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindTTSPage);
} else {
  bindTTSPage();
}
