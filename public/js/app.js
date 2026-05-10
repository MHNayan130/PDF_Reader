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

function getCurrentUser() {
  const username = getCurrentUsername();
  if (!username) return null;
  return getUsers().find((user) => user.username === username) || null;
}

function updateUser(username, updateData) {
  const users = getUsers();
  const index = users.findIndex((user) => user.username === username);
  if (index === -1) return;
  users[index] = { ...users[index], ...updateData };
  saveUsers(users);
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
  const existingUser = users.find((user) => user.username === 'MH');
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
  const image = document.getElementById('profileImage');
  if (!image) return;
  const user = getCurrentUser();
  image.src = getAvatarUrl(user);
}

function bindPopupMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const popupMenu = document.getElementById('popupMenu');
  if (!profileBtn || !popupMenu) return;
  if (profileBtn.dataset.popupBound === 'true') return;
  profileBtn.dataset.popupBound = 'true';

  profileBtn.type = 'button';
  profileBtn.setAttribute('aria-expanded', 'false');
  profileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = popupMenu.classList.toggle('show');
    profileBtn.setAttribute('aria-expanded', String(isOpen));
    popupMenu.style.display = isOpen ? 'block' : 'none';
  });

  document.addEventListener('click', (event) => {
    if (!popupMenu.contains(event.target) && event.target !== profileBtn) {
      popupMenu.classList.remove('show');
      popupMenu.style.display = 'none';
      profileBtn.setAttribute('aria-expanded', 'false');
    }
  });

  popupMenu.addEventListener('click', (event) => {
    event.stopPropagation();
    const item = event.target.closest('.popup-item');
    if (!item) return;
    if (item.dataset.action === 'logout') {
      clearCurrentUser();
      window.location.href = '/';
    } else if (item.dataset.action === 'notification') {
      alert('Notifications feature coming soon!');
    }
  });
}

function bindHomePage() {
  const uploadBtn = document.getElementById('uploadBtn');
  const continueBtn = document.getElementById('continueBtn');
  const fileInput = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const uploadSection = document.getElementById('uploadSection');

  loadProfileImage();
  bindPopupMenu();

  if (uploadBtn && uploadSection) {
    uploadBtn.addEventListener('click', () => {
      const currentDisplay = getComputedStyle(uploadSection).display;
      uploadSection.style.display = currentDisplay === 'none' ? 'block' : 'none';
    });
  }

  const fileMenuBtn = document.getElementById('fileMenuBtn');
  const fileMenuPopup = document.getElementById('fileMenuPopup');
  const uploadNewFileBtn = document.getElementById('uploadNewFileBtn');
  const createNewFileBtn = document.getElementById('createNewFileBtn');

  if (fileMenuBtn && fileMenuPopup) {
    fileMenuBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = fileMenuPopup.classList.toggle('show');
      fileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', () => {
      if (fileMenuPopup.classList.contains('show')) {
        fileMenuPopup.classList.remove('show');
        fileMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    fileMenuPopup.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  if (uploadNewFileBtn) {
    uploadNewFileBtn.addEventListener('click', () => {
      if (uploadSection) uploadSection.style.display = 'block';
      if (fileInput) fileInput.click();
      fileMenuPopup?.classList.remove('show');
      fileMenuBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  if (createNewFileBtn) {
    createNewFileBtn.addEventListener('click', () => {
      alert('Create new file is not available in this demo yet.');
      fileMenuPopup?.classList.remove('show');
      fileMenuBtn?.setAttribute('aria-expanded', 'false');
    });
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      window.location.href = '/pages/last-study.html';
    });
  }

  if (fileInput && filePreview) {
    const displayPreview = (fileInfo) => {
      const preview = document.createElement('div');
      preview.className = 'info';
      preview.innerHTML = `
        <p><strong>File:</strong> ${fileInfo.name}</p>
        <p><strong>Type:</strong> ${fileInfo.type || 'Unknown'}</p>
        <p><strong>Size:</strong> ${(fileInfo.size / 1024).toFixed(2)} KB</p>
      `;
      filePreview.innerHTML = '';
      filePreview.appendChild(preview);
    };

    const handleFile = (file) => {
      if (!file) return;
      saveLastStudy({
        name: file.name,
        type: file.type,
        size: file.size,
        savedAt: new Date().toISOString()
      });
      displayPreview(file);
    };

    fileInput.addEventListener('change', (event) => handleFile(event.target.files?.[0]));
    const dropzone = document.querySelector('.dropzone');
    if (dropzone) {
      dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        handleFile(file);
      });
      dropzone.addEventListener('dragover', (event) => event.preventDefault());
    }
  }

  bindChatSidebar();
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

  if (savedWidth) {
    const containerWidth = homeContainer.offsetWidth;
    const sidebarWidth = Math.min(parseInt(savedWidth), containerWidth * 0.5);
    chatSidebar.style.width = `${sidebarWidth}px`;
  }

  chatBtn.addEventListener('click', () => {
    const isHidden = chatSidebar.classList.contains('hidden');
    chatSidebar.classList.toggle('hidden');
    if (isHidden) {
      chatBtn.style.background = 'rgba(255, 255, 255, 0.12)';
    } else {
      chatBtn.style.background = 'rgba(255, 255, 255, 0.06)';
    }
  });

  closeChatBtn.addEventListener('click', () => {
    chatSidebar.classList.add('hidden');
    chatBtn.style.background = 'rgba(255, 255, 255, 0.06)';
  });

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = chatSidebar.offsetWidth;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const delta = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(startWidth - delta, homeContainer.offsetWidth * 0.5));
    chatSidebar.style.width = `${newWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
      localStorage.setItem(sidebarWidthKey, chatSidebar.offsetWidth);
    }
  });
}

function bindLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const googleBtn = document.getElementById('googleBtn');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const users = getUsers();
    const match = users.find((user) => user.username === username && user.password === password);

    if (!match) {
      alert('Login failed. Check your user ID and password.');
      return;
    }
    setCurrentUser(username);
    alert(`Welcome back, ${match.fullname}!`);
    window.location.href = '/pages/home.html';
  });

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      alert('Google sign-in is not connected in this demo.');
    });
  }
}

function bindSignupPage() {
  const signupForm = document.getElementById('signupForm');
  if (!signupForm) return;

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fullname = document.getElementById('signupFullname').value.trim();
    const username = document.getElementById('signupUser').value.trim();
    const password = document.getElementById('signupPass').value;
    const confirm = document.getElementById('signupConfirm').value;

    if (!fullname || !username || !password) {
      alert('Please complete all fields.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.username === username)) {
      alert('That username is already taken.');
      return;
    }

    users.push({ fullname, username, password, avatar: '' });
    saveUsers(users);
    setCurrentUser(username);
    alert('Sign up successful! Redirecting to AnyStudy.');
    window.location.href = '/pages/home.html';
  });
}

function bindResetPage() {
  const resetForm = document.getElementById('resetForm');
  if (!resetForm) return;

  resetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('resetUser').value.trim();
    const newPass = document.getElementById('resetPass').value;
    const confirm = document.getElementById('resetConfirm').value;
    if (!username || !newPass) {
      alert('Please complete all fields.');
      return;
    }
    if (newPass !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    const users = getUsers();
    const user = users.find((item) => item.username === username);
    if (!user) {
      alert('Username not found. Please sign up first.');
      return;
    }
    user.password = newPass;
    saveUsers(users);
    alert('Password reset successful. You can now log in.');
    window.location.href = '/pages/login.html';
  });
}

function bindProfilePage() {
  const profileForm = document.getElementById('profileForm');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const fullNameText = document.getElementById('profileFullnameText');
  const usernameText = document.getElementById('profileUsernameText');
  const profileMessage = document.getElementById('profileMessage');

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/';
    return;
  }

  loadProfileImage();
  bindPopupMenu();

  // Pre-fill form fields
  const fullnameInput = document.getElementById('profileFullname');
  const usernameInput = document.getElementById('profileUsername');
  const passwordInput = document.getElementById('profilePassword');
  const confirmInput = document.getElementById('profileConfirm');

  if (fullnameInput) fullnameInput.value = currentUser.fullname;
  if (usernameInput) usernameInput.value = currentUser.username;

  if (usernameText) usernameText.textContent = currentUser.username;
  if (fullNameText) fullNameText.textContent = currentUser.fullname;
  if (avatarPreview) avatarPreview.src = getAvatarUrl(currentUser);

  if (avatarInput) {
    avatarInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateUser(currentUser.username, { avatar: reader.result });
          if (avatarPreview) avatarPreview.src = reader.result;
          loadProfileImage();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullname = fullnameInput.value.trim();
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;

      if (!fullname || !username) {
        if (profileMessage) profileMessage.textContent = 'Please fill in all required fields.';
        if (profileMessage) profileMessage.style.color = '#ff6b6b';
        return;
      }

      if (password && password !== confirm) {
        if (profileMessage) profileMessage.textContent = 'Passwords do not match.';
        if (profileMessage) profileMessage.style.color = '#ff6b6b';
        return;
      }

      // Check if username is already taken by another user
      const users = getUsers();
      const existingUser = users.find((user) => user.username === username && user.username !== currentUser.username);
      if (existingUser) {
        if (profileMessage) profileMessage.textContent = 'Username is already taken.';
        if (profileMessage) profileMessage.style.color = '#ff6b6b';
        return;
      }

      // Update user data
      const updateData = { fullname, username };
      if (password) {
        updateData.password = password;
      }

      updateUser(currentUser.username, updateData);

      // If username changed, update current user
      if (username !== currentUser.username) {
        setCurrentUser(username);
      }

      if (profileMessage) {
        profileMessage.textContent = 'Profile updated successfully!';
        profileMessage.style.color = '#4CAF50';
      }

      // Update display
      if (usernameText) usernameText.textContent = username;
      if (fullNameText) fullNameText.textContent = fullname;
      loadProfileImage();

      // Clear password fields
      if (passwordInput) passwordInput.value = '';
      if (confirmInput) confirmInput.value = '';
    });
  }
}

function bindSettingsPage() {
  const settingsForm = document.getElementById('settingsForm');
  if (!settingsForm) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/';
    return;
  }

  const fullnameInput = document.getElementById('settingsFullname');
  const passwordInput = document.getElementById('settingsPass');
  const confirmInput = document.getElementById('settingsConfirm');
  const message = document.getElementById('settingsMessage');

  loadProfileImage();
  bindPopupMenu();

  if (fullnameInput) fullnameInput.value = currentUser.fullname;

  settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const fullname = fullnameInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!fullname) {
      message.textContent = 'Please enter your full name.';
      return;
    }
    if (password && password !== confirm) {
      message.textContent = 'Passwords do not match.';
      return;
    }

    updateUser(currentUser.username, {
      fullname,
      ...(password ? { password } : {})
    });
    message.textContent = 'Settings saved successfully.';
    loadProfileImage();
  });
}

function bindLastStudyPage() {
  const summary = document.getElementById('studySummary');
  const lastStudy = getLastStudy();

  loadProfileImage();
  bindPopupMenu();

  if (!summary) return;
  if (!lastStudy) {
    summary.innerHTML = '<p>No study file has been saved yet. Upload a file from the Home page to continue later.</p>';
    return;
  }

  summary.innerHTML = `
    <div class="review-card">
      <h2>Last study file</h2>
      <p><strong>Name:</strong> ${lastStudy.name}</p>
      <p><strong>Type:</strong> ${lastStudy.type || 'Unknown'}</p>
      <p><strong>Size:</strong> ${(lastStudy.size / 1024).toFixed(2)} KB</p>
      <p><strong>Saved:</strong> ${new Date(lastStudy.savedAt).toLocaleString()}</p>
    </div>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  ensureDefaultUser();
  if (document.getElementById('loginForm')) bindLoginPage();
  if (document.getElementById('signupForm')) bindSignupPage();
  if (document.getElementById('resetForm')) bindResetPage();
  if (document.getElementById('uploadBtn')) bindHomePage();
  if (document.getElementById('profileForm')) bindProfilePage();
  if (document.getElementById('settingsForm')) bindSettingsPage();
  if (document.getElementById('continueBtn')) bindLastStudyPage();

  if (document.getElementById('profileBtn')) {
    loadProfileImage();
    bindPopupMenu();
  }
});
