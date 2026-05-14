let currentReadAnswer = '';

async function bindReadPage() {
  const documentText = document.getElementById('documentText');
  const readQuestion = document.getElementById('readQuestion');
  const readAnalyzeBtn = document.getElementById('readAnalyzeBtn');
  const readAnswer = document.getElementById('readAnswer');
  const loadExistingFileBtn = document.getElementById('loadExistingFileBtn');
  const uploadNewFileReadBtn = document.getElementById('uploadNewFileReadBtn');
  const readFileInput = document.getElementById('readFileInput');
  const copyReadAnswerBtn = document.getElementById('copyReadAnswerBtn');
  const addToPdfDocBtn = document.getElementById('addToPdfDocBtn');

  // Load extracted text from file viewer if available
  const extractedText = localStorage.getItem('extractedTextForAI');
  const extractedFilename = localStorage.getItem('extractedTextFilename');
  if (extractedText) {
    documentText.value = extractedText;
    const selectedFileInfo = document.getElementById('selectedFileInfo');
    if (selectedFileInfo) {
      selectedFileInfo.style.display = 'block';
      const selectedFileName = document.getElementById('selectedFileName');
      if (selectedFileName) {
        selectedFileName.textContent = extractedFilename || 'Extracted Text';
      }
    }
    // Clear from storage so it's only used once
    localStorage.removeItem('extractedTextForAI');
    localStorage.removeItem('extractedTextFilename');
  }

  loadProfileImage();
  bindPopupMenu();

  // File loading handlers
  if (loadExistingFileBtn) {
    loadExistingFileBtn.addEventListener('click', showLoadFileDialog);
  }

  if (uploadNewFileReadBtn && readFileInput) {
    uploadNewFileReadBtn.addEventListener('click', () => readFileInput.click());
    readFileInput.addEventListener('change', handleReadFileUpload);
  }

  if (readAnalyzeBtn) {
    readAnalyzeBtn.addEventListener('click', analyzeDocument);
  }

  if (copyReadAnswerBtn) {
    copyReadAnswerBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentReadAnswer);
      alert('Answer copied to clipboard!');
    });
  }

  if (addToPdfDocBtn) {
    addToPdfDocBtn.addEventListener('click', () => {
      const answer = currentReadAnswer.trim();
      if (!answer) {
        alert('No answer to add. Please analyze a document first.');
        return;
      }
      // Save to local storage to be picked up by pdf-doc page
      localStorage.setItem('anystudy-pending-content', answer);
      alert('Answer added to Generate PDF/Doc tool! You can now navigate there to use it.');
    });
  }
}

function handleReadFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('documentText').value = event.target.result;
    updateSelectedFileInfo('readFileInput', 'selectedFileInfo', 'selectedFileName');
  };
  reader.readAsText(file);
}

function showLoadFileDialog() {
  // This would typically show a dialog to select from uploaded files
  alert('Load existing file feature - you can implement a file browser here.');
}

function updateSelectedFileInfo(inputId, containerID, spanId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerID);
  const span = document.getElementById(spanId);

  if (input.files.length > 0) {
    span.textContent = input.files[0].name;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

async function analyzeDocument() {
  const documentText = document.getElementById('documentText').value.trim();
  const readQuestion = document.getElementById('readQuestion').value.trim();
  const readAnalyzeBtn = document.getElementById('readAnalyzeBtn');
  const readAnswer = document.getElementById('readAnswer');
  const copyReadAnswerBtn = document.getElementById('copyReadAnswerBtn');
  const addToPdfDocBtn = document.getElementById('addToPdfDocBtn');

  if (!documentText || !readQuestion) {
    alert('Please enter both document text and a question.');
    return;
  }

  readAnalyzeBtn.disabled = true;
  readAnalyzeBtn.textContent = 'Analyzing...';

  try {
    const response = await fetch('/api/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: documentText, question: readQuestion }),
    });

    if (!response.ok) throw new Error('Failed to analyze document');
    const data = await response.json();

    currentReadAnswer = data.answer;
    readAnswer.innerHTML = `<p>${escapeHtml(data.answer)}</p>`;
    copyReadAnswerBtn.style.display = 'block';
    addToPdfDocBtn.style.display = 'block';
  } catch (error) {
    readAnswer.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
  } finally {
    readAnalyzeBtn.disabled = false;
    readAnalyzeBtn.textContent = 'Analyze';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindReadPage);
} else {
  bindReadPage();
}
