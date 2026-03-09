/**
 * Bookmarks Manager - SanchezCabron OS
 * Gestión de enlaces favoritos con localStorage y Favicons automáticos.
 */

const BOOKMARKS_KEY = 'sanchez_bookmarks_db';

let bookmarks = [];
let quickEditingBookmarkId = null;

const dom = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔗 Sistema de Marcadores Iniciado');
    
    // DOM Elements
    dom.grid = document.getElementById('bookmarksGrid');
    dom.modal = document.getElementById('bookmarkModal');
    dom.form = document.getElementById('bookmarkForm');
    dom.addBtn = document.getElementById('addBookmarkBtn');
    dom.closeBtn = document.getElementById('closeBookmarkModal');
    
    // Load Data
    loadBookmarks();
    
    // Event Listeners
    setupEventListeners();
    
    // Initial Render
    renderBookmarks();
});

function loadBookmarks() {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (stored) {
        bookmarks = JSON.parse(stored);
    } else {
        // Datos de ejemplo iniciales para que no se vea vacío
        bookmarks = [
            { id: 1, name: 'YouTube', url: 'https://youtube.com', category: 'Entretenimiento' },
            { id: 2, name: 'GitHub', url: 'https://github.com', category: 'Trabajo' },
            { id: 3, name: 'ChatGPT', url: 'https://chat.openai.com', category: 'Trabajo' }
        ];
        saveBookmarks();
    }
}

function saveBookmarks() {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function setupEventListeners() {
    // Modal controls
    dom.addBtn.addEventListener('click', () => {
        dom.form.reset();
        dom.modal.style.display = 'flex';
    });
    
    dom.closeBtn.addEventListener('click', () => {
        dom.modal.style.display = 'none';
    });
    
    // Close modal on outside click
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) dom.modal.style.display = 'none';
    });

    // Form Submit
    dom.form.addEventListener('submit', (e) => {
        e.preventDefault();
        addBookmark();
    });
}

function addBookmark() {
    const name = document.getElementById('bmName').value.trim();
    let url = document.getElementById('bmUrl').value.trim();
    const category = document.getElementById('bmCategory').value;

    if (!name || !url) return;

    // Asegurar protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const newBookmark = {
        id: Date.now(),
        name,
        url,
        category
    };

    bookmarks.unshift(newBookmark);
    saveBookmarks();
    renderBookmarks();
    
    dom.modal.style.display = 'none';
    dom.form.reset();
}

function deleteBookmark(id, event) {
    event.stopPropagation(); // Evitar abrir el link al borrar
    if (confirm('¿Eliminar este marcador?')) {
        bookmarks = bookmarks.filter(b => b.id !== id);
        saveBookmarks();
        renderBookmarks();
    }
}

function toggleBookmarkQuickEdit(id, btn) {
    const card = btn.closest('.bookmark-card');
    const isEditing = card.classList.contains('quick-edit-mode');

    if (quickEditingBookmarkId && quickEditingBookmarkId !== id) {
        const otherCard = document.querySelector(`.bookmark-card.quick-edit-mode`);
        if (otherCard) cancelBookmarkQuickEdit(quickEditingBookmarkId, otherCard);
    }

    if (isEditing) {
        cancelBookmarkQuickEdit(id, card);
    } else {
        quickEditingBookmarkId = id;
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark) return;

        card.classList.add('quick-edit-mode');
        const overlay = card.querySelector('.quick-edit-overlay');

        overlay.innerHTML = `
            <label style="font-size: 0.8rem; color: var(--text-muted);">Nombre</label>
            <input type="text" id="quick-edit-name-${id}" class="quick-edit-input" value="${bookmark.name}">
            <label style="font-size: 0.8rem; color: var(--text-muted);">URL</label>
            <input type="url" id="quick-edit-url-${id}" class="quick-edit-input" value="${bookmark.url}">
            <div class="quick-edit-actions">
                <button class="quick-edit-btn quick-edit-cancel" onclick="event.stopPropagation(); cancelBookmarkQuickEdit(${id})"><i class="fa-solid fa-xmark"></i></button>
                <button class="quick-edit-btn quick-edit-confirm" onclick="event.stopPropagation(); saveBookmarkQuickEdit(${id})"><i class="fa-solid fa-check"></i></button>
            </div>
        `;

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveBookmarkQuickEdit(id);
            } else if (e.key === 'Escape') {
                cancelBookmarkQuickEdit(id);
            }
        });
        
        overlay.querySelector('input').focus();
    }
}

function saveBookmarkQuickEdit(id) {
    const card = document.querySelector(`.bookmark-card[data-bookmark-id="${id}"]`);
    if (!card) return;

    const newName = card.querySelector(`#quick-edit-name-${id}`).value;
    let newUrl = card.querySelector(`#quick-edit-url-${id}`).value;

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        newUrl = 'https://' + newUrl;
    }

    const index = bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
        bookmarks[index].name = newName;
        bookmarks[index].url = newUrl;
        saveBookmarks();
        renderBookmarks();
    }
    quickEditingBookmarkId = null;
}

function cancelBookmarkQuickEdit(id, cardElement) {
    const card = cardElement || document.querySelector(`.bookmark-card[data-bookmark-id="${id}"]`);
    if (card) {
        card.classList.remove('quick-edit-mode');
        const overlay = card.querySelector('.quick-edit-overlay');
        overlay.innerHTML = '';
    }
    quickEditingBookmarkId = null;
}

function renderBookmarks() {
    if (!dom.grid) return;
    
    if (bookmarks.length === 0) {
        dom.grid.innerHTML = `<p class="empty-state" style="text-align:center; grid-column: 1 / -1;">No hay marcadores guardados.</p>`;
        return;
    }

    dom.grid.innerHTML = bookmarks.map(bm => {
        // Google Favicon Service: Extraer dominio para mejor precisión
        let domain = bm.url;
        try {
            domain = new URL(bm.url).hostname;
        } catch(e) {}
        
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        return `
            <div class="bookmark-card" data-bookmark-id="${bm.id}">
                <div class="quick-edit-overlay"></div>
                <div style="display: contents;" onclick="window.open('${bm.url}', '_blank')">
                    <img src="${faviconUrl}" alt="${bm.name}" class="bookmark-icon" onerror="this.src='https://via.placeholder.com/64?text=LINK'">
                    <div class="bookmark-title">${bm.name}</div>
                </div>
                <div class="card-actions" style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; opacity: 0; transition: opacity 0.3s ease;">
                    <button class="action-btn" onclick="event.stopPropagation(); toggleBookmarkQuickEdit(${bm.id}, this)" title="Edición Rápida" style="width: 28px; height: 28px; background: rgba(84, 165, 212, 0.8);"><i class="fa-solid fa-bolt fa-xs"></i></button>
                    <button class="bookmark-delete" onclick="deleteBookmark(${bm.id}, event)" title="Eliminar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Exponer función globalmente para el HTML onclick
window.deleteBookmark = deleteBookmark;
window.toggleBookmarkQuickEdit = toggleBookmarkQuickEdit;
window.saveBookmarkQuickEdit = saveBookmarkQuickEdit;
window.cancelBookmarkQuickEdit = cancelBookmarkQuickEdit;