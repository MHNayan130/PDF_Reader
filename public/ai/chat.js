async function bindChatPage() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const modelSelect = document.getElementById('modelSelect');

  loadProfileImage();
  bindPopupMenu();

  if (chatSendBtn && chatInput) {
    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message) return;

      const selectedModel = modelSelect ? modelSelect.value : 'deepseek-ai/DeepSeek-V3:novita';

      // Add user message to chat
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-message user-message';
      userMsg.innerHTML = `<p>${escapeHtml(message)}</p>`;
      chatMessages.appendChild(userMsg);
      chatInput.value = '';

      // Show loading
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'chat-message bot-message';
      loadingMsg.innerHTML = `<p class="loading">...</p>`;
      chatMessages.appendChild(loadingMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, model: selectedModel }),
        });

        if (!response.ok) throw new Error('Failed to get response');
        const data = await response.json();

        loadingMsg.innerHTML = `<p>${escapeHtml(data.reply)}</p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } catch (error) {
        loadingMsg.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(error.message)}</p>`;
      }
    };

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
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
  document.addEventListener('DOMContentLoaded', bindChatPage);
} else {
  bindChatPage();
}
