/**
 * Bookmarks Manager - SanchezCabron OS
 * Gestión de enlaces favoritos con localStorage y Favicons automáticos.
 */

const BOOKMARKS_KEY = 'sanchez_bookmarks_db';

let bookmarks = [];
let quickEditingBookmarkId = null;

const dom = {};

document.addEventListener('DOMContentLoaded', () => {
<!-- Personalización Section - Step 1 -->
<section class="about-section" style="margin-top: 2rem;">
    <h2 style="margin-bottom: 1.5rem;"><i class="fa-solid fa-palette"></i> Personalización</h2>
    <p style="margin-bottom: 2rem;">Selecciona un tema para cambiar la apariencia visual de todo el sistema.</p>

    <!-- Theme Grid -->
    <div id="themeGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
        
        <!-- Oscuro Clásico (Active by Default) -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #1b2838; border: 3px solid #66c0f4; box-shadow: 0 0 15px rgba(102, 192, 244, 0.6); position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #66c0f4;"></div>
            </div>
            <span style="font-size: 0.9rem; color: #fff; font-weight: 600; display: block;">Oscuro Clásico</span>
        </div>

        <!-- Midnight -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #0a0a0f; border: 2px solid #333; position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #3b82f6;"></div>
            </div>
            <span style="font-size: 0.9rem; color: var(--color-text-secondary); display: block;">Midnight</span>
        </div>

        <!-- Blood -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #1a0505; border: 2px solid #333; position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #ef4444;"></div>
            </div>
            <span style="font-size: 0.9rem; color: var(--color-text-secondary); display: block;">Blood</span>
        </div>

        <!-- Matrix -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #000000; border: 2px solid #333; position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #00ff41;"></div>
            </div>
            <span style="font-size: 0.9rem; color: var(--color-text-secondary); display: block;">Matrix</span>
        </div>

        <!-- Gold -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #121212; border: 2px solid #333; position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #fbbf24;"></div>
            </div>
            <span style="font-size: 0.9rem; color: var(--color-text-secondary); display: block;">Gold</span>
        </div>

        <!-- Arctic -->
        <div class="theme-swatch" style="text-align: center; cursor: pointer;">
            <div style="width: 70px; height: 70px; margin: 0 auto 12px; border-radius: 50%; background: #f0f9ff; border: 2px solid #333; position: relative; overflow: hidden;">
                <div style="position: absolute; bottom: 0; width: 100%; height: 40%; background: #0ea5e9;"></div>
            </div>
            <span style="font-size: 0.9rem; color: var(--color-text-secondary); display: block;">Arctic</span>
        </div>

    </div>

    <!-- Actions -->
    <div style="border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
        <button id="resetThemeBtn" class="btn btn-secondary" style="margin: 0;">
            <i class="fa-solid fa-rotate-left"></i> Restaurar por defecto
        </button>
    </div>
</section>
    
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