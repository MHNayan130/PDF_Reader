let referenceDocText = '';

async function bindSpeechPage() {
  const audioFileInput = document.getElementById('audioFileInput');
  const audioInfo = document.getElementById('audioInfo');
  const audioFileName = document.getElementById('audioFileName');
  const audioFileSize = document.getElementById('audioFileSize');
  const transcribeBtn = document.getElementById('transcribeBtn');
  const transcriptionResult = document.getElementById('transcriptionResult');
  const copyTranscriptionBtn = document.getElementById('copyTranscriptionBtn');
  const audioDropzone = document.querySelector('.audio-dropzone');
  const micBtn = document.getElementById('micBtn');
  const micStatus = document.getElementById('micStatus');
  const loadExistingSpeechFileBtn = document.getElementById('loadExistingSpeechFileBtn');
  const uploadSpeechFileBtn = document.getElementById('uploadSpeechFileBtn');
  const speechDocInput = document.getElementById('speechDocInput');
  const comparisonSection = document.getElementById('comparisonSection');
  const comparisonResult = document.getElementById('comparisonResult');
  const matchPercentage = document.getElementById('matchPercentage');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechRecognitionSupported = !!SpeechRecognition;
  let recognition = null;
  let listening = false;

  loadProfileImage();
  bindPopupMenu();

  // Document file loading handlers
  if (loadExistingSpeechFileBtn) {
    loadExistingSpeechFileBtn.addEventListener('click', showLoadFileDialog);
  }

  if (uploadSpeechFileBtn && speechDocInput) {
    uploadSpeechFileBtn.addEventListener('click', () => speechDocInput.click());
    speechDocInput.addEventListener('change', handleSpeechDocUpload);
  }

  let selectedFile = null;

  function updateFileInfo(file) {
    selectedFile = file;
    audioFileName.textContent = file.name;
    audioFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    audioInfo.style.display = 'block';
    transcribeBtn.disabled = false;
    transcribeBtn.textContent = 'Transcribe Audio';
  }

  function handleFile(file) {
    if (!file) return;

    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/mp4'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|m4a|mp4)$/i)) {
      alert('Please select a valid audio file (MP3, WAV, FLAC, M4A)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      alert('File size must be less than 25MB');
      return;
    }

    updateFileInfo(file);
  }

  function updateMicStatus(message, isError = false) {
    if (!micStatus) return;
    micStatus.innerHTML = `<span style="color: ${isError ? '#ff6b6b' : '#e9f0ff'};">${escapeHtml(message)}</span>`;
  }

  function updateTranscriptionDisplay(text) {
    if (!transcriptionResult) return;
    transcriptionResult.innerHTML = `<p>${escapeHtml(text)}</p>`;
    if (copyTranscriptionBtn) {
      copyTranscriptionBtn.style.display = text.trim() ? 'inline-block' : 'none';
    }
    // Compare with reference if available
    if (referenceDocText) {
      compareWithReference(text);
    }
  }

  function compareWithReference(transcription) {
    if (!referenceDocText) return;

    comparisonSection.style.display = 'block';
    const refWords = referenceDocText.toLowerCase().split(/\s+/);
    const transWords = transcription.toLowerCase().split(/\s+/);
    let matchCount = 0;
    let comparisonHTML = '';

    transWords.forEach(word => {
      if (refWords.some(rw => rw.includes(word) || word.includes(rw))) {
        comparisonHTML += `<span class="matched-word">${escapeHtml(word)}</span> `;
        matchCount++;
      } else {
        comparisonHTML += `<span class="unmatched-word">${escapeHtml(word)}</span> `;
      }
    });

    comparisonResult.innerHTML = comparisonHTML;
    const percentage = Math.round((matchCount / transWords.length) * 100);
    matchPercentage.textContent = `Match: ${percentage}% (${matchCount}/${transWords.length} words matched)`;
  }

  function handleSpeechDocUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      referenceDocText = event.target.result;
      document.getElementById('referenceDocText').textContent = referenceDocText.substring(0, 300) + '...';
      document.getElementById('referenceDocPreview').style.display = 'block';
      updateSelectedFileInfo('speechDocInput', 'selectedSpeechFileInfo', 'selectedSpeechFileName');
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

  function startRecognition() {
    if (!SpeechRecognition) {
      updateMicStatus('Speech recognition is not supported in this browser.', true);
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      listening = true;
      if (micBtn) micBtn.textContent = '⏹ Stop Microphone';
      updateMicStatus('Listening... speak now.');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      updateTranscriptionDisplay(transcript);
    };

    recognition.onerror = (event) => {
      updateMicStatus(`Microphone error: ${event.error}`, true);
      listening = false;
      if (micBtn) micBtn.textContent = '🎙 Start Microphone';
    };

    recognition.onend = () => {
      listening = false;
      if (micBtn) micBtn.textContent = '🎙 Start Microphone';
      updateMicStatus('Microphone stopped. Click Start Microphone to record again.');
    };

    recognition.start();
  }

  function stopRecognition() {
    if (!recognition) return;
    recognition.stop();
  }

  if (micBtn) {
    micBtn.addEventListener('click', () => {
      if (!isSpeechRecognitionSupported) {
        alert('Live transcription requires SpeechRecognition support in your browser.');
        return;
      }
      if (listening) {
        stopRecognition();
      } else {
        startRecognition();
      }
    });

    if (!isSpeechRecognitionSupported) {
      micBtn.disabled = true;
      updateMicStatus('Live transcription is not supported in this browser.');
    }
  }

  if (audioFileInput) {
    audioFileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      handleFile(file);
    });
  }

  if (audioDropzone) {
    audioDropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      audioDropzone.classList.add('dragover');
    });

    audioDropzone.addEventListener('dragleave', () => {
      audioDropzone.classList.remove('dragover');
    });

    audioDropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      audioDropzone.classList.remove('dragover');
      const file = event.dataTransfer.files?.[0];
      handleFile(file);
    });
  }

  if (transcribeBtn) {
    transcribeBtn.addEventListener('click', async () => {
      if (!selectedFile) return;

      transcribeBtn.disabled = true;
      transcribeBtn.textContent = 'Transcribing...';

      try {
        const formData = new FormData();
        formData.append('audio', selectedFile);

        const response = await fetch('/api/speech-to-text', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to transcribe audio');
        const data = await response.json();

        transcriptionResult.innerHTML = `<p>${escapeHtml(data.transcription)}</p>`;
        copyTranscriptionBtn.style.display = 'inline-block';
      } catch (error) {
        transcriptionResult.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
      } finally {
        transcribeBtn.disabled = false;
        transcribeBtn.textContent = 'Transcribe Audio';
      }
    });
  }

  if (copyTranscriptionBtn) {
    copyTranscriptionBtn.addEventListener('click', () => {
      const text = transcriptionResult.textContent;
      navigator.clipboard.writeText(text).then(() => {
        alert('Transcription copied to clipboard!');
      });
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindSpeechPage);
} else {
  bindSpeechPage();
}
