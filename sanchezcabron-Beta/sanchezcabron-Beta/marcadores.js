/**
 * Bookmarks Manager - SanchezCabron OS
 * Gestión de enlaces favoritos con localStorage y Favicons automáticos.
 */

const BOOKMARKS_KEY = 'sanchez_bookmarks_db';

let bookmarks = [];
let currentCategory = 'all';

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

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderBookmarks();
        });
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

    bookmarks.push(newBookmark);
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

function renderBookmarks() {
    if (!dom.grid) return;
    
    let filtered = bookmarks;
    if (currentCategory !== 'all') {
        filtered = bookmarks.filter(b => b.category === currentCategory);
    }

    dom.grid.innerHTML = filtered.map(bm => {
        // Google Favicon Service: Extraer dominio para mejor precisión
        let domain = bm.url;
        try {
            domain = new URL(bm.url).hostname;
        } catch(e) {}
        
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        return `
            <div class="bookmark-card" onclick="window.open('${bm.url}', '_blank')">
                <button class="bookmark-delete" onclick="deleteBookmark(${bm.id}, event)" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
                <img src="${faviconUrl}" alt="${bm.name}" class="bookmark-icon" onerror="this.src='https://via.placeholder.com/64?text=LINK'">
                <div class="bookmark-title">${bm.name}</div>
            </div>
        `;
    }).join('');
}

// Exponer función globalmente para el HTML onclick
window.deleteBookmark = deleteBookmark;