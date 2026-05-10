async function bindReadPage() {
  const documentText = document.getElementById('documentText');
  const readQuestion = document.getElementById('readQuestion');
  const readAnalyzeBtn = document.getElementById('readAnalyzeBtn');
  const readAnswer = document.getElementById('readAnswer');

  loadProfileImage();
  bindPopupMenu();

  if (readAnalyzeBtn) {
    readAnalyzeBtn.addEventListener('click', async () => {
      const text = documentText.value.trim();
      const question = readQuestion.value.trim();

      if (!text || !question) {
        alert('Please enter both document text and a question.');
        return;
      }

      readAnalyzeBtn.disabled = true;
      readAnalyzeBtn.textContent = 'Analyzing...';

      try {
        const response = await fetch('/api/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, question }),
        });

        if (!response.ok) throw new Error('Failed to analyze document');
        const data = await response.json();

        readAnswer.innerHTML = `<p>${escapeHtml(data.answer)}</p>`;
      } catch (error) {
        readAnswer.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
      } finally {
        readAnalyzeBtn.disabled = false;
        readAnalyzeBtn.textContent = 'Analyze';
      }
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
  document.addEventListener('DOMContentLoaded', bindReadPage);
} else {
  bindReadPage();
}
