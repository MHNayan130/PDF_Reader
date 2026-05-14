const storageKey = 'anystudy-users';
const currentUserKey = 'anystudy-current-user';
const lastStudyKey = 'anystudy-last-study';
const defaultAvatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="12" cy="12" r="12" fill="%238d94ff"/%3E%3Cpath d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="white" stroke-width="1.5" stroke-linecap="round"/%3E%3Ccircle cx="12" cy="8.5" r="3.5" fill="white"/%3E%3C/svg%3E';

function getUsers() {
  return JSON.parse(localStorage.getItem(storageKey) || '[]');
}
function saveUsers(users) {
  localStorage.setItem(storageKey, JSON.stringify(users));
}
function getCurrentUsername() {
  return localStorage.getItem(currentUserKey);
}
function setCurrentUser(username) {
  localStorage.setItem(currentUserKey, username);
}
function clearCurrentUser() {
  localStorage.removeItem(currentUserKey);
}
function saveLastStudy(fileInfo) {
  localStorage.setItem(lastStudyKey, JSON.stringify(fileInfo));
}
function getLastStudy() {
  return JSON.parse(localStorage.getItem(lastStudyKey) || 'null');
}
function ensureDefaultUser() {
  const users = getUsers();
  const existingUser = users.find((u) => u.username === 'MH');
  if (existingUser) {
    existingUser.password = '1234';
  } else {
    users.push({ fullname: 'MH', username: 'MH', password: '1234', avatar: '' });
  }
  saveUsers(users);
}

function getAvatarUrl(user) {
  return user?.avatar || defaultAvatar;
}

function loadProfileImage() {
  const img = document.getElementById('profileImage');
  if (!img) return;
  const username = getCurrentUsername();
  const user = getUsers().find((u) => u.username === username);
  img.src = getAvatarUrl(user);
}

function bindPopupMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const popupMenu = document.getElementById('popupMenu');
  if (!profileBtn || !popupMenu) return;
  if (profileBtn.dataset.popupBound === 'true') return;
  profileBtn.dataset.popupBound = 'true';

  profileBtn.type = 'button';
  profileBtn.setAttribute('aria-expanded', 'false');
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = popupMenu.classList.toggle('show');
    profileBtn.setAttribute('aria-expanded', String(isOpen));
    popupMenu.style.display = isOpen ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!popupMenu.contains(e.target) && e.target !== profileBtn) {
      popupMenu.classList.remove('show');
      popupMenu.style.display = 'none';
      profileBtn.setAttribute('aria-expanded', 'false');
    }
  });

  popupMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = e.target.closest('.popup-item');
    if (!item) return;
    if (item.dataset.action === 'logout') {
      clearCurrentUser();
      window.location.href = '/';
    } else if (item.dataset.action === 'notification') {
      alert('Notifications coming soon');
    }
  });
}

function bindChatSidebar() {
  const chatBtn = document.getElementById('chatSidebarToggle');
  const closeChatBtn = document.getElementById('closeChatSidebar');
  const chatSidebar = document.getElementById('chatSidebar');
  const divider = document.getElementById('sidebarDivider');
  const homeContainer = document.querySelector('.home-container');
  if (!chatBtn || !chatSidebar) return;

  const sidebarWidthKey = 'chatSidebarWidth';
  const savedWidth = localStorage.getItem(sidebarWidthKey);
  if (savedWidth && homeContainer) {
    const containerWidth = homeContainer.offsetWidth;
    const sidebarWidth = Math.min(parseInt(savedWidth), containerWidth * 0.5);
    chatSidebar.style.width = `${sidebarWidth}px`;
  }

  chatBtn.addEventListener('click', () => {
    chatSidebar.classList.toggle('hidden');
    chatBtn.style.background = chatSidebar.classList.contains('hidden') ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)';
  });

  if (closeChatBtn) {
    closeChatBtn.addEventListener('click', () => {
      chatSidebar.classList.add('hidden');
      chatBtn.style.background = 'rgba(255,255,255,0.06)';
    });
  }

  let isResizing = false; let startX = 0; let startWidth = 0;
  if (divider && homeContainer) {
    divider.addEventListener('mousedown', (e) => {
      isResizing = true; startX = e.clientX; startWidth = chatSidebar.offsetWidth;
      divider.classList.add('dragging'); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    });
  }
  document.addEventListener('mousemove', (e) => {
    if (!isResizing || !homeContainer) return; const delta = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(startWidth - delta, homeContainer.offsetWidth * 0.5));
    chatSidebar.style.width = `${newWidth}px`;
  });
  document.addEventListener('mouseup', () => {
    if (isResizing) { isResizing = false; divider.classList.remove('dragging'); document.body.style.cursor = 'auto'; document.body.style.userSelect = 'auto'; localStorage.setItem(sidebarWidthKey, chatSidebar.offsetWidth); }
  });

  // sidebar chat bindings
  const sidebarChatInput = document.getElementById('sidebarChatInput');
  const sidebarChatSendBtn = document.getElementById('sidebarChatSendBtn');
  const sidebarChatMessages = document.getElementById('sidebarChatMessages');
  const sidebarModelSelect = document.getElementById('sidebarModelSelect');

  if (sidebarChatSendBtn && sidebarChatInput && sidebarChatMessages) {
    const sendSidebarMessage = async () => {
      const message = sidebarChatInput.value.trim(); if (!message) return;
      const selectedModel = sidebarModelSelect ? sidebarModelSelect.value : 'deepseek-ai/DeepSeek-V3:novita';

      const userMsg = document.createElement('div'); userMsg.className = 'chat-message user-message'; userMsg.innerHTML = `<p>${escapeHtml(message)}</p>`;
      sidebarChatMessages.appendChild(userMsg); sidebarChatInput.value = '';

      const loadingMsg = document.createElement('div'); loadingMsg.className = 'chat-message bot-message'; loadingMsg.innerHTML = `<p class="loading">...</p>`;
      sidebarChatMessages.appendChild(loadingMsg); sidebarChatMessages.scrollTop = sidebarChatMessages.scrollHeight;

      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, model: selectedModel }) });
        if (!res.ok) throw new Error('Failed to get response');
        const data = await res.json(); loadingMsg.innerHTML = `<p>${escapeHtml(data.reply)}</p>`; sidebarChatMessages.scrollTop = sidebarChatMessages.scrollHeight;
      } catch (err) {
        loadingMsg.innerHTML = `<p style="color: #ff6b6b;">Error: ${escapeHtml(err.message)}</p>`;
      }
    };
    sidebarChatSendBtn.addEventListener('click', sendSidebarMessage);
    sidebarChatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendSidebarMessage(); });
  }
}

function bindHomePage() {
  loadProfileImage(); bindPopupMenu();

  const uploadBtn = document.getElementById('uploadBtn');
  const uploadSection = document.getElementById('uploadSection');
  if (uploadBtn && uploadSection) uploadBtn.addEventListener('click', () => { uploadSection.style.display = (getComputedStyle(uploadSection).display === 'none') ? 'block' : 'none'; });

  const fileInput = document.getElementById('fileInput');
  const uploadModal = document.getElementById('uploadModal');
  const filePreviewInfo = document.getElementById('filePreviewInfo');
  const confirmUploadBtn = document.getElementById('confirmUploadBtn');
  const cancelUploadBtn = document.getElementById('cancelUploadBtn');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
  let selectedFile = null;

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      selectedFile = e.target.files?.[0];
      if (selectedFile && uploadModal) {
        // Read file content for preview only (no file info)
        const reader = new FileReader();
        reader.onload = (event) => {
          let contentPreview = `<div class="file-content-preview"><p style="color: #ccc; margin-bottom: 12px; font-size: 0.9rem;"><strong>${escapeHtml(selectedFile.name)}</strong> • ${(selectedFile.size / 1024).toFixed(2)} KB</p>`;
          
          // Handle text files
          if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.csv')) {
            const text = event.target.result;
            contentPreview += `<pre>${escapeHtml(text.substring(0, 800))}</pre>${text.length > 800 ? '<p style="color: #888; font-size: 0.9rem; text-align: center;">... (truncated, more in full viewer)</p>' : ''}`;
          }
          // Handle images
          else if (selectedFile.type.includes('image')) {
            contentPreview += `<img src="${event.target.result}" style="max-width: 100%; max-height: 250px; border-radius: 8px; margin-top: 12px;" />`;
          }
          // Handle PDF
          else if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
            contentPreview += `<p style="color: #aaa; font-style: italic; text-align: center; padding: 40px 0;">PDF preview will be available after upload</p>`;
          }
          // Handle Office documents
          else if (selectedFile.type.includes('word') || selectedFile.type.includes('document') || selectedFile.name.endsWith('.docx') || selectedFile.name.endsWith('.doc')) {
            contentPreview += `<p style="color: #aaa; font-style: italic; text-align: center; padding: 40px 0;">Word document will be viewable after upload</p>`;
          }
          else if (selectedFile.type.includes('presentation') || selectedFile.name.endsWith('.pptx') || selectedFile.name.endsWith('.ppt')) {
            contentPreview += `<p style="color: #aaa; font-style: italic; text-align: center; padding: 40px 0;">PowerPoint slides will be viewable after upload</p>`;
          }
          
          contentPreview += '</div>';
          filePreviewInfo.innerHTML = contentPreview;
        };
        
        // Read based on file type
        if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.csv')) {
          reader.readAsText(selectedFile);
        } else if (selectedFile.type.includes('image')) {
          reader.readAsDataURL(selectedFile);
        } else {
          // For non-readable files, show placeholder
          filePreviewInfo.innerHTML = `<div class="file-content-preview"><p style="color: #ccc; margin-bottom: 12px; font-size: 0.9rem;"><strong>${escapeHtml(selectedFile.name)}</strong> • ${(selectedFile.size / 1024).toFixed(2)} KB</p><p style="color: #aaa; font-style: italic; text-align: center; padding: 40px 0;">Preview available after upload</p></div>`;
        }
        
        uploadModal.style.display = 'flex';
      }
    });
  }

  if (confirmUploadBtn && uploadModal) {
    confirmUploadBtn.addEventListener('click', async () => {
      if (!selectedFile) { alert('No file selected'); return; }
      const formData = new FormData();
      formData.append('file', selectedFile);
      confirmUploadBtn.disabled = true;
      confirmUploadBtn.textContent = 'Uploading...';
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const responseText = await res.text();
        console.log('Upload response:', res.status, responseText);
        if (!res.ok) throw new Error(`Upload failed: ${responseText}`);
        const data = JSON.parse(responseText);
        saveLastStudy({ name: selectedFile.name, type: selectedFile.type, size: selectedFile.size, savedAt: new Date().toISOString(), fileUrl: data.fileUrl, filename: data.filename });
        uploadModal.style.display = 'none'; selectedFile = null;
        confirmUploadBtn.disabled = false;
        confirmUploadBtn.textContent = 'Upload';
        setTimeout(() => {
          window.location.href = `/pages/file-viewer.html?file=${encodeURIComponent(data.filename)}`;
        }, 500);
      } catch (err) {
        console.error('Upload error details:', err);
        confirmUploadBtn.disabled = false;
        confirmUploadBtn.textContent = 'Upload';
        alert('Upload error: ' + err.message);
      }
    });
  }

  const closeModal = () => { if (uploadModal) uploadModal.style.display = 'none'; selectedFile = null; };
  if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

  const fileMenuBtn = document.getElementById('fileMenuBtn'); const fileMenuPopup = document.getElementById('fileMenuPopup');
  if (fileMenuBtn && fileMenuPopup) {
    fileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); const isOpen = fileMenuPopup.classList.toggle('show'); fileMenuBtn.setAttribute('aria-expanded', String(isOpen)); });
    document.addEventListener('click', () => { if (fileMenuPopup.classList.contains('show')) { fileMenuPopup.classList.remove('show'); fileMenuBtn.setAttribute('aria-expanded', 'false'); } });
  }

  bindChatSidebar();
}

function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

// Minimal page binds for auth pages (kept simple)
function bindLoginPage() {
  const loginForm = document.getElementById('loginForm'); if (!loginForm) return;
  loginForm.addEventListener('submit', (e) => { e.preventDefault(); const username = document.getElementById('loginUser').value.trim(); const password = document.getElementById('loginPass').value; const users = getUsers(); const match = users.find(u => u.username === username && u.password === password); if (!match) { alert('Login failed'); return; } setCurrentUser(username); alert(`Welcome back, ${match.fullname}`); window.location.href = '/pages/home.html'; });
}
function bindSignupPage() { const signupForm = document.getElementById('signupForm'); if (!signupForm) return; signupForm.addEventListener('submit', (e) => { e.preventDefault(); const fullname = document.getElementById('signupFullname').value.trim(); const username = document.getElementById('signupUser').value.trim(); const password = document.getElementById('signupPass').value; const confirm = document.getElementById('signupConfirm').value; if (!fullname||!username||!password) { alert('Please complete all fields'); return; } if (password!==confirm) { alert('Passwords do not match'); return; } const users = getUsers(); if (users.some(u=>u.username===username)) { alert('Username taken'); return; } users.push({ fullname, username, password, avatar: '' }); saveUsers(users); setCurrentUser(username); alert('Sign up successful'); window.location.href = '/pages/home.html'; }); }

window.addEventListener('DOMContentLoaded', () => {
  ensureDefaultUser();
  if (document.getElementById('loginForm')) bindLoginPage();
  if (document.getElementById('signupForm')) bindSignupPage();
  if (document.getElementById('uploadBtn')) bindHomePage();
  if (document.getElementById('profileBtn')) { loadProfileImage(); bindPopupMenu(); }
});
