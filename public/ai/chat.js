let attachedFiles = [];

async function bindChatPage() {
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const modelSelect = document.getElementById('modelSelect');
  const uploadPicBtn = document.getElementById('uploadPicBtn');
  const uploadPdfBtn = document.getElementById('uploadPdfBtn');
  const uploadDocBtn = document.getElementById('uploadDocBtn');
  const picInput = document.getElementById('picInput');
  const pdfInput = document.getElementById('pdfInput');
  const docInput = document.getElementById('docInput');

  loadProfileImage();
  bindPopupMenu();

  // File upload handlers
  if (uploadPicBtn && picInput) {
    uploadPicBtn.addEventListener('click', () => picInput.click());
    picInput.addEventListener('change', (e) => handleFileUpload(e, 'picture'));
  }

  if (uploadPdfBtn && pdfInput) {
    uploadPdfBtn.addEventListener('click', () => pdfInput.click());
    pdfInput.addEventListener('change', (e) => handleFileUpload(e, 'pdf'));
  }

  if (uploadDocBtn && docInput) {
    uploadDocBtn.addEventListener('click', () => docInput.click());
    docInput.addEventListener('change', (e) => handleFileUpload(e, 'document'));
  }

  if (chatSendBtn && chatInput) {
    const sendMessage = async () => {
      const message = chatInput.value.trim();
      if (!message && attachedFiles.length === 0) return;

      const selectedModel = modelSelect ? modelSelect.value : 'deepseek-ai/DeepSeek-V3:novita';

      // Add user message to chat
      const userMsg = document.createElement('div');
      userMsg.className = 'chat-message user-message';
      let msgContent = `<p>${escapeHtml(message)}</p>`;
      if (attachedFiles.length > 0) {
        msgContent += '<div class="attached-files-in-chat">';
        attachedFiles.forEach(f => {
          msgContent += `<span class="file-badge">${f.type === 'picture' ? '🖼️' : f.type === 'pdf' ? '📄' : '📋'} ${f.name}</span>`;
        });
        msgContent += '</div>';
      }
      userMsg.innerHTML = msgContent;
      chatMessages.appendChild(userMsg);
      chatInput.value = '';
      attachedFiles = [];
      updateFilesList();

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
          body: JSON.stringify({ message, model: selectedModel, files: attachedFiles }),
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

function handleFileUpload(e, type) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    attachedFiles.push({
      type: type,
      name: file.name,
      data: event.target.result,
    });
    updateFilesList();
  };
  reader.readAsDataURL(file);
}

function updateFilesList() {
  const filesContainer = document.getElementById('attachedFiles');
  const filesList = document.getElementById('filesList');

  if (attachedFiles.length === 0) {
    filesContainer.style.display = 'none';
    return;
  }

  filesContainer.style.display = 'block';
  filesList.innerHTML = '';

  attachedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <span>${file.type === 'picture' ? '🖼️' : file.type === 'pdf' ? '📄' : '📋'} ${file.name}</span>
      <button type="button" onclick="removeAttachedFile(${index})">✕</button>
    `;
    filesList.appendChild(item);
  });
}

function removeAttachedFile(index) {
  attachedFiles.splice(index, 1);
  updateFilesList();
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
