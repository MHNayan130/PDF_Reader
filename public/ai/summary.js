let currentSummary = '';

async function bindSummaryPage() {
  const summaryInput = document.getElementById('summaryInput');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryOutput = document.getElementById('summaryOutput');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const addSummaryToPdfDocBtn = document.getElementById('addSummaryToPdfDocBtn');
  const loadExistingFileSummaryBtn = document.getElementById('loadExistingFileSummaryBtn');
  const uploadNewFileSummaryBtn = document.getElementById('uploadNewFileSummaryBtn');
  const summaryFileInput = document.getElementById('summaryFileInput');

  // Load extracted text from file viewer if available
  const extractedText = localStorage.getItem('extractedTextForAI');
  const extractedFilename = localStorage.getItem('extractedTextFilename');
  if (extractedText) {
    summaryInput.value = extractedText;
    const selectedFileSummaryInfo = document.getElementById('selectedFileSummaryInfo');
    if (selectedFileSummaryInfo) {
      selectedFileSummaryInfo.style.display = 'block';
      const selectedSummaryFileName = document.getElementById('selectedSummaryFileName');
      if (selectedSummaryFileName) {
        selectedSummaryFileName.textContent = extractedFilename || 'Extracted Text';
      }
    }
    // Clear from storage so it's only used once
    localStorage.removeItem('extractedTextForAI');
    localStorage.removeItem('extractedTextFilename');
  }

  loadProfileImage();
  bindPopupMenu();

  // File loading handlers
  if (loadExistingFileSummaryBtn) {
    loadExistingFileSummaryBtn.addEventListener('click', showLoadFileDialog);
  }

  if (uploadNewFileSummaryBtn && summaryFileInput) {
    uploadNewFileSummaryBtn.addEventListener('click', () => summaryFileInput.click());
    summaryFileInput.addEventListener('change', handleSummaryFileUpload);
  }

  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', summarizeText);
  }

  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentSummary);
      alert('Summary copied to clipboard!');
    });
  }

  if (addSummaryToPdfDocBtn) {
    addSummaryToPdfDocBtn.addEventListener('click', () => {
      const summary = currentSummary.trim();
      if (!summary) {
        alert('No summary to add. Please summarize text first.');
        return;
      }
      // Save to local storage to be picked up by pdf-doc page
      localStorage.setItem('anystudy-pending-content', summary);
      alert('Summary added to Generate PDF/Doc tool! You can now navigate there to use it.');
    });
  }
}

function handleSummaryFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('summaryInput').value = event.target.result;
    updateSelectedFileInfo('summaryFileInput', 'selectedFileSummaryInfo', 'selectedSummaryFileName');
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

async function summarizeText() {
  const summaryInput = document.getElementById('summaryInput');
  const text = summaryInput.value.trim();
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryOutput = document.getElementById('summaryOutput');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const addSummaryToPdfDocBtn = document.getElementById('addSummaryToPdfDocBtn');

  if (!text) {
    alert('Please enter some text to summarize.');
    return;
  }

  summarizeBtn.disabled = true;
  summarizeBtn.textContent = 'Summarizing...';

  try {
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Failed to generate summary');
    const data = await response.json();

    currentSummary = data.summary;
    summaryOutput.innerHTML = `<p>${escapeHtml(data.summary)}</p>`;
    copySummaryBtn.style.display = 'block';
    addSummaryToPdfDocBtn.style.display = 'block';
  } catch (error) {
    summaryOutput.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
  } finally {
    summarizeBtn.disabled = false;
    summarizeBtn.textContent = 'Summarize';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto-bind on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindSummaryPage);
} else {
  bindSummaryPage();
}
