async function bindSummaryPage() {
  const summaryInput = document.getElementById('summaryInput');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryOutput = document.getElementById('summaryOutput');
  const copySummaryBtn = document.getElementById('copySummaryBtn');

  loadProfileImage();
  bindPopupMenu();

  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', async () => {
      const text = summaryInput.value.trim();

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

        summaryOutput.innerHTML = `<p>${escapeHtml(data.summary)}</p>`;
        copySummaryBtn.style.display = 'inline-block';
      } catch (error) {
        summaryOutput.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
      } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.textContent = 'Summarize';
      }
    });
  }

  if (copySummaryBtn) {
    copySummaryBtn.addEventListener('click', () => {
      const text = summaryOutput.textContent;
      navigator.clipboard.writeText(text).then(() => {
        alert('Summary copied to clipboard!');
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
  document.addEventListener('DOMContentLoaded', bindSummaryPage);
} else {
  bindSummaryPage();
}
