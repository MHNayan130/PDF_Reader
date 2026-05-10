// Translation functionality
document.addEventListener('DOMContentLoaded', function() {
  const sourceText = document.getElementById('sourceText');
  const translationResult = document.getElementById('translationResult');
  const translateBtn = document.getElementById('translateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const swapBtn = document.getElementById('swapBtn');
  const fromLang = document.getElementById('fromLang');
  const toLang = document.getElementById('toLang');
  const charCount = document.getElementById('charCount');

  let isTranslating = false;

  // Character count
  sourceText.addEventListener('input', function() {
    charCount.textContent = this.value.length;
  });

  // Swap languages
  swapBtn.addEventListener('click', function() {
    const tempLang = fromLang.value;
    const tempText = sourceText.value;
    const tempResult = translationResult.innerHTML;

    fromLang.value = toLang.value;
    toLang.value = tempLang;
    sourceText.value = getTextFromResult(translationResult);
    updateTranslationResult(tempText);
  });

  // Translate text
  translateBtn.addEventListener('click', async function() {
    if (isTranslating) return;

    const text = sourceText.value.trim();
    if (!text) {
      showError('Please enter text to translate');
      return;
    }

    if (fromLang.value === toLang.value) {
      showError('Please select different languages');
      return;
    }

    isTranslating = true;
    translateBtn.disabled = true;
    translateBtn.textContent = 'Translating...';

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          fromLang: fromLang.value,
          toLang: toLang.value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      updateTranslationResult(data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      showError('Translation failed. Please try again.');
    } finally {
      isTranslating = false;
      translateBtn.disabled = false;
      translateBtn.textContent = 'Translate';
    }
  });

  // Copy translation
  copyBtn.addEventListener('click', async function() {
    const text = getTextFromResult(translationResult);
    if (!text || text === 'Translation will appear here...') {
      showError('No translation to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      showError('Failed to copy to clipboard');
    }
  });

  // Clear all
  clearBtn.addEventListener('click', function() {
    sourceText.value = '';
    updateTranslationResult('');
    charCount.textContent = '0';
  });

  // Enter key to translate
  sourceText.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      translateBtn.click();
    }
  });

  function updateTranslationResult(text) {
    if (text) {
      translationResult.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    } else {
      translationResult.innerHTML = '<p class="placeholder">Translation will appear here...</p>';
    }
  }

  function getTextFromResult(resultElement) {
    const p = resultElement.querySelector('p');
    if (p && !p.classList.contains('placeholder')) {
      return p.textContent;
    }
    return '';
  }

  function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4757;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
});