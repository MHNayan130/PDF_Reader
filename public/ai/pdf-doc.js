async function bindPdfDocPage() {
  const docTitle = document.getElementById('docTitle');
  const docContent = document.getElementById('docContent');
  const docFormat = document.getElementById('docFormat');
  const generateDocBtn = document.getElementById('generateDocBtn');
  const docPreview = document.getElementById('docPreview');

  loadProfileImage();
  bindPopupMenu();

  if (generateDocBtn) {
    generateDocBtn.addEventListener('click', async () => {
      const title = docTitle.value.trim();
      const content = docContent.value.trim();
      const format = docFormat.value;

      if (!title || !content) {
        alert('Please enter both title and content.');
        return;
      }

      generateDocBtn.disabled = true;
      generateDocBtn.textContent = 'Generating...';

      try {
        const response = await fetch('/api/generate-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, format }),
        });

        if (!response.ok) throw new Error('Failed to generate document');
        const data = await response.json();

        // Update preview
        docPreview.innerHTML = `
          <div style="white-space: pre-wrap; font-family: monospace; font-size: 0.9rem;">
            ${escapeHtml(data.content)}
          </div>
        `;

        // Simulate download
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.${format === 'pdf' ? 'pdf' : 'docx'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        docPreview.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
      } finally {
        generateDocBtn.disabled = false;
        generateDocBtn.textContent = 'Generate & Download';
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
  document.addEventListener('DOMContentLoaded', bindPdfDocPage);
} else {
  bindPdfDocPage();
}
