let editor = null;
let attachedMedia = [];

async function bindPdfDocPage() {
  const docTitle = document.getElementById('docTitle');
  const docContent = document.getElementById('docContent');
  const docFormat = document.getElementById('docFormat');
  const generateDocBtn = document.getElementById('generateDocBtn');
  const saveDraftBtn = document.getElementById('saveDraftBtn');
  const docPreview = document.getElementById('docPreview');
  const uploadImageBtn = document.getElementById('uploadImageBtn');
  const uploadVoiceBtn = document.getElementById('uploadVoiceBtn');
  const imageInput = document.getElementById('imageInput');
  const voiceInput = document.getElementById('voiceInput');

  loadProfileImage();
  bindPopupMenu();
  initTiptapEditor();
  loadDrafts();

  // Image upload
  if (uploadImageBtn && imageInput) {
    uploadImageBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageUpload);
  }

  // Voice upload
  if (uploadVoiceBtn && voiceInput) {
    uploadVoiceBtn.addEventListener('click', () => voiceInput.click());
    voiceInput.addEventListener('change', handleVoiceUpload);
  }

  // Save draft
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', saveDraft);
  }

  // Generate document
  if (generateDocBtn) {
    generateDocBtn.addEventListener('click', generateDocument);
  }
}

function initTiptapEditor() {
  const editorElement = document.getElementById('editor');
  if (!editorElement) return;

  if (window.Tiptap && window.Tiptap.useEditor) {
    editor = new window.Tiptap.Editor({
      element: editorElement,
      extensions: [
        window.Tiptap.StarterKit,
      ],
      content: '<p>Start typing your document content here...</p>',
    });
  } else if (window.TiptapCore && window.TiptapStarterKit) {
    // Fallback for CDN
    editor = new window.TiptapCore.Editor({
      element: editorElement,
      extensions: [
        window.TiptapStarterKit.StarterKit,
      ],
      content: '<p>Start typing your document content here...</p>',
    });
  }
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    attachedMedia.push({
      type: 'image',
      name: file.name,
      data: event.target.result,
    });
    updateMediaList();
  };
  reader.readAsDataURL(file);
}

function handleVoiceUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  attachedMedia.push({
    type: 'voice',
    name: file.name,
    file: file,
  });
  updateMediaList();
}

function updateMediaList() {
  const mediaListContainer = document.getElementById('attachedMedia');
  const mediaList = document.getElementById('mediaList');

  if (attachedMedia.length === 0) {
    mediaListContainer.style.display = 'none';
    return;
  }

  mediaListContainer.style.display = 'block';
  mediaList.innerHTML = '';

  attachedMedia.forEach((media, index) => {
    const item = document.createElement('div');
    item.className = 'media-item';
    item.innerHTML = `
      <span>${media.type === 'image' ? '🖼️' : '🎵'} ${media.name}</span>
      <button type="button" onclick="removeMedia(${index})">Remove</button>
    `;
    mediaList.appendChild(item);
  });
}

function removeMedia(index) {
  attachedMedia.splice(index, 1);
  updateMediaList();
}

function saveDraft() {
  const title = document.getElementById('docTitle').value.trim();
  if (!title) {
    alert('Please enter a document title to save as draft.');
    return;
  }

  const editorContent = editor ? editor.getHTML() : document.getElementById('docContent').value;
  
  const draft = {
    id: Date.now(),
    title: title,
    content: editorContent,
    media: attachedMedia.map(m => ({ type: m.type, name: m.name })),
    format: document.getElementById('docFormat').value,
    savedAt: new Date().toLocaleString(),
  };

  let drafts = JSON.parse(localStorage.getItem('anystudy-drafts') || '[]');
  drafts.push(draft);
  localStorage.setItem('anystudy-drafts', JSON.stringify(drafts));

  alert(`Draft "${title}" saved successfully!`);
  loadDrafts();
}

function loadDrafts() {
  const drafts = JSON.parse(localStorage.getItem('anystudy-drafts') || '[]');
  const draftsList = document.getElementById('draftsList');

  if (drafts.length === 0) {
    draftsList.innerHTML = '<p class="placeholder">No drafts saved yet. Save content to create drafts.</p>';
    return;
  }

  draftsList.innerHTML = '';
  drafts.forEach((draft) => {
    const draftElement = document.createElement('div');
    draftElement.className = 'draft-item';
    draftElement.innerHTML = `
      <p class="draft-title">${escapeHtml(draft.title)}</p>
      <p class="draft-time">Saved: ${draft.savedAt}</p>
      <div class="draft-actions">
        <button type="button" class="load-draft-btn" onclick="loadDraft(${draft.id})">Load</button>
        <button type="button" class="delete-draft-btn" onclick="deleteDraft(${draft.id})">Delete</button>
      </div>
    `;
    draftsList.appendChild(draftElement);
  });
}

function loadDraft(draftId) {
  const drafts = JSON.parse(localStorage.getItem('anystudy-drafts') || '[]');
  const draft = drafts.find(d => d.id === draftId);

  if (!draft) return;

  document.getElementById('docTitle').value = draft.title;
  document.getElementById('docFormat').value = draft.format;

  if (editor) {
    editor.commands.setContent(draft.content);
  } else {
    document.getElementById('docContent').value = draft.content;
  }

  // Update preview
  const docPreview = document.getElementById('docPreview');
  docPreview.innerHTML = draft.content;

  alert(`Loaded draft: "${draft.title}"`);
}

function deleteDraft(draftId) {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  let drafts = JSON.parse(localStorage.getItem('anystudy-drafts') || '[]');
  drafts = drafts.filter(d => d.id !== draftId);
  localStorage.setItem('anystudy-drafts', JSON.stringify(drafts));

  loadDrafts();
}

async function generateDocument() {
  const docTitle = document.getElementById('docTitle').value.trim();
  const editorContent = editor ? editor.getHTML() : document.getElementById('docContent').value.trim();
  const docFormat = document.getElementById('docFormat').value;
  const generateDocBtn = document.getElementById('generateDocBtn');
  const docPreview = document.getElementById('docPreview');

  if (!docTitle || !editorContent) {
    alert('Please enter both title and content.');
    return;
  }

  generateDocBtn.disabled = true;
  generateDocBtn.textContent = 'Generating...';

  try {
    const response = await fetch('/api/generate-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: docTitle, content: editorContent, format: docFormat }),
    });

    if (!response.ok) throw new Error('Failed to generate document');
    const data = await response.json();

    // Update preview
    docPreview.innerHTML = editorContent;

    // Simulate download
    const blob = new Blob([data.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle}.${docFormat === 'pdf' ? 'pdf' : 'docx'}`;
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
