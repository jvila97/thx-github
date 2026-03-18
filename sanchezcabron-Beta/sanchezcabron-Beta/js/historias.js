/**
 * Stories Engine - SanchezCabron OS
 * Sistema de gestión de historias por capítulos (Wattpad Style).
 */

const STORIES_KEY = 'sanchez_stories_v2';
const FALLBACK_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='sans-serif' font-size='20'%3ENO COVER%3C/text%3E%3C/svg%3E";

let stories = [];
let currentStoryId = null; // Para saber qué historia estamos editando/leyendo
let currentChapterIndex = 0; // Índice del capítulo actual en lectura

// Reader Preferences Default
const readerPrefs = {
    fontFamily: 'serif', // 'serif' or 'sans'
    fontSize: 18,
    theme: 'dark'
};

const app = {
    quickEditingId: null,
    
    init: () => {
        app.loadStories();
        app.setupEventListeners();
        app.renderLibrary();
    },

    loadStories: () => {
        const stored = localStorage.getItem(STORIES_KEY);
        if (stored) {
            stories = JSON.parse(stored);

            // Data migration for image paths from old 'img/' structure
            let needsSave = false;
            stories.forEach(story => {
                // Fix main cover
                if (story.cover && story.cover.startsWith('img/')) {
                    story.cover = `../assets/${story.cover}`; // 'img/historias/file.jpg' -> '../assets/img/historias/file.jpg'
                    needsSave = true;
                }
                // Fix album images inside lore
                if (story.lore && story.lore.album) {
                    story.lore.album.forEach(albumEntry => {
                        if (albumEntry.url && albumEntry.url.startsWith('img/')) {
                            albumEntry.url = `../assets/${albumEntry.url}`; // 'img/historias/album/file.png' -> '../assets/img/historias/album/file.png'
                            needsSave = true;
                        }
                    });
                }
            });

            if (needsSave) {
                localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
            }
        }
    },

    saveStories: () => {
        localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
        app.renderLibrary();
    },

    setupEventListeners: () => {
        // Modal Controls
        const modal = document.getElementById('storyModal');
        const btnNew = document.getElementById('btnNewStory');
        const btnClose = document.getElementById('closeStoryModal');
        const form = document.getElementById('storyForm');
        const chapterForm = document.getElementById('chapterForm');

        if (btnNew) btnNew.addEventListener('click', () => {
            form.reset();
            modal.style.display = 'flex';
        });

        if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');
        
        // Close on click outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        // Form Submit
        if (form) form.addEventListener('submit', app.handleCreateStory);
        
        // Chapter Form Submit
        if (chapterForm) chapterForm.addEventListener('submit', app.handleSaveChapter);
    },

    handleCreateStory: (e) => {
        e.preventDefault();
        const title = document.getElementById('storyTitle').value.trim();
        const genre = document.getElementById('storyGenre').value;
        const coverInput = document.getElementById('storyCover').value.trim();

        // Procesar imagen (si es local o URL)
        let cover = coverInput;
        if (coverInput && !coverInput.startsWith('http') && !coverInput.startsWith('data:')) {
            cover = `../assets/img/historias/${coverInput}`;
        }

        const newStory = {
            id: Date.now(),
            title,
            genre,
            cover: cover || '',
            rarity: 'common', // Default rarity
            createdAt: new Date().toLocaleDateString(),
            chapters: [] // Array vacío para futuros capítulos
        };

        stories.unshift(newStory);
        app.saveStories();
        
        document.getElementById('storyModal').style.display = 'none';
        
        // Logro potencial
        if (typeof desbloquearLogro === 'function') desbloquearLogro('writer_born');
    },

    deleteStory: (id) => {
        if (confirm('¿Seguro que quieres eliminar esta historia? Esta acción no se puede deshacer')) {
            stories = stories.filter(s => s.id !== id);
            app.saveStories();
            app.renderLibrary();
            app.showToast('Historia eliminada');
        }
    },

    toggleStoryQuickEdit: (id, btn) => {
        const card = btn.closest('.story-card-v2');
        const isEditing = card.classList.contains('quick-edit-mode');

        if (app.quickEditingId && app.quickEditingId !== id) {
            const otherCard = document.querySelector(`.story-card-v2.quick-edit-mode`);
            if (otherCard) app.cancelStoryQuickEdit(app.quickEditingId, otherCard);
        }

        if (isEditing) {
            app.cancelStoryQuickEdit(id, card);
        } else {
            app.quickEditingId = id;
            const story = stories.find(s => s.id === id);
            if (!story) return;

            card.classList.add('quick-edit-mode');
            const overlay = card.querySelector('.quick-edit-overlay');

            overlay.innerHTML = `
                <label style="font-size: 0.8rem; color: var(--text-muted);">Título</label>
                <input type="text" id="quick-edit-title-${id}" class="quick-edit-input" value="${story.title}">
                <label style="font-size: 0.8rem; color: var(--text-muted);">Género</label>
                <select id="quick-edit-genre-${id}" class="quick-edit-input">
                    <option value="Aventura" ${story.genre === 'Aventura' ? 'selected' : ''}>⚔️ Aventura</option>
                    <option value="Sci-Fi" ${story.genre === 'Sci-Fi' ? 'selected' : ''}>🚀 Sci-Fi</option>
                    <option value="Fantasía" ${story.genre === 'Fantasía' ? 'selected' : ''}>🔮 Fantasía</option>
                    <option value="Terror" ${story.genre === 'Terror' ? 'selected' : ''}>👻 Terror</option>
                    <option value="Slice of Life" ${story.genre === 'Slice of Life' ? 'selected' : ''}>☕ Slice of Life</option>
                    <option value="Código" ${story.genre === 'Código' ? 'selected' : ''}>💻 Código / Dev</option>
                </select>
                <label style="font-size: 0.8rem; color: var(--text-muted);">Rareza</label>
                <select id="quick-edit-rarity-${id}" class="quick-edit-input">
                    <option value="common" ${story.rarity === 'common' ? 'selected' : ''}>⚪ Común</option>
                    <option value="rare" ${story.rarity === 'rare' ? 'selected' : ''}>🔵 Raro</option>
                    <option value="epic" ${story.rarity === 'epic' ? 'selected' : ''}>🟣 Épico</option>
                    <option value="legendary" ${story.rarity === 'legendary' ? 'selected' : ''}>🟡 Legendario</option>
                </select>
                <div class="quick-edit-actions">
                    <button class="quick-edit-btn quick-edit-cancel" onclick="event.stopPropagation(); app.cancelStoryQuickEdit(${id})"><i class="fa-solid fa-xmark"></i></button>
                    <button class="quick-edit-btn quick-edit-confirm" onclick="event.stopPropagation(); app.saveStoryQuickEdit(${id})"><i class="fa-solid fa-check"></i></button>
                </div>
            `;

            overlay.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    app.saveStoryQuickEdit(id);
                } else if (e.key === 'Escape') {
                    app.cancelStoryQuickEdit(id);
                }
            });
            
            overlay.querySelector('input').focus();
        }
    },

    saveStoryQuickEdit: (id) => {
        const card = document.getElementById(`story-${id}`);
        if (!card) return;

        const newTitle = card.querySelector(`#quick-edit-title-${id}`).value;
        const newGenre = card.querySelector(`#quick-edit-genre-${id}`).value;
        const newRarity = card.querySelector(`#quick-edit-rarity-${id}`).value;

        const index = stories.findIndex(s => s.id === id);
        if (index !== -1) {
            stories[index].title = newTitle;
            stories[index].genre = newGenre;
            stories[index].rarity = newRarity || 'common';
            app.saveStories();
        }
        app.quickEditingId = null;
    },

    cancelStoryQuickEdit: (id, cardElement) => {
        const card = cardElement || document.getElementById(`story-${id}`);
        if (card) {
            card.classList.remove('quick-edit-mode');
            const overlay = card.querySelector('.quick-edit-overlay');
            overlay.innerHTML = '';
        }
        app.quickEditingId = null;
    },

    // --- GESTIÓN DE CAPÍTULOS ---

    openChapterManager: (id) => {
        currentStoryId = id;
        document.getElementById('chapterForm').reset();
        document.getElementById('chapterModal').style.display = 'flex';
    },

    handleSaveChapter: (e) => {
        e.preventDefault();
        if (!currentStoryId) return;

        const title = document.getElementById('chapTitle').value.trim();
        const content = document.getElementById('chapContent').value; // Respetar saltos de línea

        const storyIndex = stories.findIndex(s => s.id === currentStoryId);
        if (storyIndex !== -1) {
            const newChapter = {
                id: Date.now(),
                title,
                content
            };
            
            stories[storyIndex].chapters.push(newChapter);
            app.saveStories(); // Esto actualiza el contador en la UI
            
            document.getElementById('chapterModal').style.display = 'none';
            alert('¡Capítulo añadido correctamente!');
        }
    },

    // --- GESTIÓN DE LORE (DATA ARCHIVE) ---

    openLoreManager: (id) => {
        currentStoryId = id;
        const story = stories.find(s => s.id === id);
        if (!story) return;

        // Inicializar objeto lore si no existe (migración de datos antiguos)
        if (!story.lore) {
            story.lore = { synopsis: '', powerScale: '', worldRules: '', characters: [], album: [] };
        }

        // Rellenar campos
        document.getElementById('loreSynopsis').value = story.lore.synopsis || '';
        document.getElementById('lorePowerScale').value = story.lore.powerScale || '';
        document.getElementById('loreWorldRules').value = story.lore.worldRules || '';

        // Renderizar personajes
        const charContainer = document.getElementById('charactersList');
        charContainer.innerHTML = '';
        if (story.lore.characters && story.lore.characters.length > 0) {
            story.lore.characters.forEach(char => app.addCharacterRow(char.name, char.desc));
        } else {
            app.addCharacterRow(); // Añadir uno vacío por defecto
        }
        
        // Renderizar Álbum
        const albumContainer = document.getElementById('albumList');
        albumContainer.innerHTML = '';
        if (story.lore.album && story.lore.album.length > 0) {
            story.lore.album.forEach(img => app.addAlbumImageRow(img.url, img.name, img.desc, img.rarity));
        } else {
            app.addAlbumImageRow(); // Uno vacío
        }

        // Resetear tabs a la primera
        app.switchLoreTab('synopsis');
        document.getElementById('loreModal').style.display = 'flex';
    },

    switchLoreTab: (tabName) => {
        // Ocultar todos los paneles
        document.querySelectorAll('.lore-panel').forEach(p => p.classList.remove('active'));
        // Desactivar botones
        document.querySelectorAll('.lore-tab-btn').forEach(b => b.classList.remove('active'));
        
        // Activar seleccionado
        document.getElementById(`tab-${tabName}`).classList.add('active');
        // Encontrar el botón correspondiente (truco simple buscando por texto o onclick)
        const buttons = document.querySelectorAll('.lore-tab-btn');
        if(tabName === 'synopsis') buttons[0].classList.add('active');
        if(tabName === 'world') buttons[1].classList.add('active');
        if(tabName === 'chars') buttons[2].classList.add('active');
        if(tabName === 'album') buttons[3].classList.add('active');
    },

    addCharacterRow: (name = '', desc = '') => {
        const container = document.getElementById('charactersList');
        const div = document.createElement('div');
        div.className = 'character-row';
        div.innerHTML = `
            <input type="text" class="terminal-input char-name" placeholder="Nombre" value="${name}" style="font-weight:bold; color:var(--accent-color);">
            <textarea class="terminal-input char-desc" rows="2" placeholder="Descripción / Habilidades">${desc}</textarea>
            <button class="action-btn delete-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(div);
    },

    addAlbumImageRow: (url = '', name = '', desc = '', rarity = 'common') => {
        const container = document.getElementById('albumList');
        const div = document.createElement('div');
        div.className = 'character-row'; // Reutilizamos estilo de fila
        div.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:5px; flex:1;">
                <input type="text" class="terminal-input img-url" placeholder="Archivo (ej: m1.png)" value="${url}">
                <select class="rarity-select img-rarity">
                    <option value="common" ${rarity === 'common' ? 'selected' : ''}>Común</option>
                    <option value="rare" ${rarity === 'rare' ? 'selected' : ''}>Raro</option>
                    <option value="epic" ${rarity === 'epic' ? 'selected' : ''}>Épico</option>
                    <option value="legendary" ${rarity === 'legendary' ? 'selected' : ''}>Legendario</option>
                </select>
            </div>
            <input type="text" class="terminal-input img-name" placeholder="Nombre Entidad" value="${name}" style="flex:1;">
            <textarea class="terminal-input img-desc" rows="2" placeholder="Descripción breve" style="flex:2;">${desc}</textarea>
            <button class="action-btn delete-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(div);
    },

    saveLore: () => {
        if (!currentStoryId) return;
        const story = stories.find(s => s.id === currentStoryId);
        
        // Recopilar personajes
        const charRows = document.querySelectorAll('#charactersList .character-row');
        const characters = Array.from(charRows).map(row => ({
            name: row.querySelector('.char-name').value,
            desc: row.querySelector('.char-desc').value
        })).filter(c => c.name.trim() !== ''); // Filtrar vacíos

        // Recopilar Álbum
        const albumRows = document.querySelectorAll('#albumList .character-row');
        const album = Array.from(albumRows).map(row => ({
            url: row.querySelector('.img-url').value,
            name: row.querySelector('.img-name').value,
            desc: row.querySelector('.img-desc').value,
            rarity: row.querySelector('.img-rarity').value
        })).filter(a => a.url.trim() !== '');

        story.lore = {
            synopsis: document.getElementById('loreSynopsis').value,
            powerScale: document.getElementById('lorePowerScale').value,
            worldRules: document.getElementById('loreWorldRules').value,
            characters: characters,
            album: album
        };

        app.saveStories();
        alert('Archivo de Datos actualizado.');
    },

    // --- UTILIDADES ---

    showToast: (msg) => {
        let toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    // --- PORTABILIDAD DE DATOS (IMPORT/EXPORT) ---

    exportStory: (id) => {
        const story = stories.find(s => s.id === id);
        if (!story) return;
        
        // Ensure full data structure structure for export
        if (!story.lore) {
            story.lore = { synopsis: '', powerScale: '', worldRules: '', characters: [], album: [] };
        } else {
            story.lore.synopsis = story.lore.synopsis || '';
            story.lore.powerScale = story.lore.powerScale || '';
            story.lore.worldRules = story.lore.worldRules || '';
            story.lore.characters = story.lore.characters || [];
            story.lore.album = story.lore.album || [];
        }
        if (!story.chapters) story.chapters = [];

        // Ensure rarity exists
        if (!story.rarity) story.rarity = 'common';

        const dataStr = JSON.stringify(story, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        // Nombre de archivo seguro: historia_titulo_limpio.json
        const safeTitle = story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `historia_${safeTitle}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Historia exportada.\n\nNOTA: Recuerda copiar manualmente la imagen de portada a la carpeta "img/historias/" en el destino si no es una URL web.');
    },

    exportLibrary: () => {
        const dataStr = JSON.stringify(stories, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sanchez_chronicles_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    triggerImport: () => {
        document.getElementById('importFile').click();
    },

    handleImport: (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Caso 1: Importar Librería Completa (Array)
                if (Array.isArray(importedData)) {
                    if (confirm(`Se han encontrado ${importedData.length} historias. ¿Fusionar con la librería actual?`)) {
                        // Fusionar evitando duplicados por ID
                        importedData.forEach(newStory => {
                            if (!stories.some(s => s.id === newStory.id)) stories.unshift(newStory);
                        });
                        app.saveStories();
                        alert('Biblioteca importada correctamente.');
                    }
                } 
                // Caso 2: Importar Historia Única (Objeto)
                else if (importedData.title && importedData.chapters) {
                    // Generar nuevo ID para evitar conflictos
                    importedData.id = Date.now(); 
                    stories.unshift(importedData);
                    app.saveStories();
                    alert(`Historia "${importedData.title}" importada.\n\nNOTA: Asegúrate de mover la imagen de portada a la carpeta correcta.`);
                } else {
                    alert('Error: Formato de archivo no válido.');
                }
            } catch (err) {
                console.error(err);
                alert('Error al leer el archivo JSON.');
            }
            // Limpiar input para permitir re-importar el mismo archivo
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    // --- MODO LECTURA ---

    openReader: (id) => {
        const story = stories.find(s => s.id === id);
        if (!story) return;

        currentStoryId = id;
        const savedIndex = localStorage.getItem(`sanchez_bookmark_${id}`);
        currentChapterIndex = savedIndex ? parseInt(savedIndex) : 0;
        
        // Load Reader Preferences
        const savedPrefs = localStorage.getItem('sanchez_reader_prefs');
        if (savedPrefs) Object.assign(readerPrefs, JSON.parse(savedPrefs));

        app.renderImmersiveReader();
        document.body.classList.add('reading-mode-active');
        document.getElementById('readerOverlay').style.display = 'flex';
    },

    closeReader: () => {
        document.getElementById('readerOverlay').style.display = 'none';
        document.body.classList.remove('reading-mode-active');
        
        // Stop animations if any
        const canvas = document.getElementById('particleCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    renderImmersiveReader: () => {
        const story = stories.find(s => s.id === currentStoryId);
        const overlay = document.getElementById('readerOverlay');
        
        if (!story) return;
        
        // Ensure rarity defaults
        const rarity = story.rarity || 'common';

        // Construct background styles correctly to preserve CSS gradients
        const leftBgStyle = `linear-gradient(90deg, var(--ambient-color), transparent), url('${story.cover || ''}')`;
        const rightBgStyle = `linear-gradient(-90deg, var(--ambient-color), transparent), url('${story.cover || ''}')`;

        // --- HTML Structure for Immersive Reader ---
        overlay.innerHTML = `
            <div class="reader-progress-bar" id="readerProgressBar"></div>
            
            <!-- Background Layers -->
            <div class="reader-bg bg-${rarity}"></div>
            ${rarity === 'legendary' ? '<canvas id="particleCanvas"></canvas>' : ''}

            <!-- Immersive Side Panels -->
            <div class="reader-side-panel left panel-${rarity}" style="background-image: ${leftBgStyle}"></div>
            <div class="reader-side-panel right panel-${rarity}" style="background-image: ${rightBgStyle}"></div>
            
            <!-- Floating UI -->
            <button class="reader-float-btn btn-exit" onclick="app.closeReader()" title="Salir"><i class="fa-solid fa-xmark"></i></button>
            
            <div class="reader-container" id="readerContainer">
                <div class="reader-content-wrapper" id="readerContentWrapper" style="font-family: ${readerPrefs.fontFamily === 'serif' ? '"Merriweather", serif' : '"Poppins", sans-serif'}; font-size: ${readerPrefs.fontSize}px;">
                    <!-- Content injected here -->
                </div>
            </div>

            <!-- Table of Contents Sidebar -->
            <div class="reader-toc-backdrop" id="readerTocBackdrop" onclick="app.toggleChapterPanel(false)"></div>
            <div class="reader-toc-sidebar" id="readerTocSidebar">
                <div class="toc-header">
                    <h3>Índice</h3>
                    <button class="btn-icon" onclick="app.toggleChapterPanel(false)"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="toc-list">
                    <!-- Dynamically populated by buildChapterPanel -->
                </div>
            </div>

            <!-- Controls Toolbar -->
            <div class="reader-controls-toolbar">
                <button class="reader-ctrl-btn" onclick="app.toggleReaderFont()" title="Cambiar Fuente">
                    <i class="fa-solid fa-font"></i>
                </button>
                <div class="reader-size-ctrl">
                    <button class="reader-ctrl-btn small" onclick="app.adjustFontSize(-2)">A-</button>
                    <span id="fontSizeDisplay">${readerPrefs.fontSize}</span>
                    <button class="reader-ctrl-btn small" onclick="app.adjustFontSize(2)">A+</button>
                </div>
                <button class="reader-ctrl-btn" onclick="app.toggleChapterPanel()" title="Índice">
                    <i class="fa-solid fa-list-ol"></i>
                </button>
            </div>

            <!-- Chapter Navigation Fixed Bottom -->
            <div class="chapter-nav-fixed">
                <button class="chap-nav-btn" id="btnPrevChap" onclick="app.prevChapter()" ${currentChapterIndex === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-chevron-left"></i> Anterior
                </button>
                <div class="chap-info-display">
                    <span class="chap-number" id="chapNumDisplay">CAPÍTULO ${currentChapterIndex + 1}</span>
                </div>
                <button class="chap-nav-btn" id="btnNextChap" onclick="app.nextChapter()" ${!story.chapters.length || currentChapterIndex >= story.chapters.length - 1 ? 'disabled' : ''}>
                    Siguiente <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        `;

        // Initialize Legendary Particles if needed
        if (rarity === 'legendary') {
            setTimeout(app.initLegendaryParticles, 100);
        }

        app.loadChapterContent();
        app.buildChapterPanel(); // Load sidebar content immediately
        
        // Scroll Event for Progress Bar
        const container = document.getElementById('readerContainer');
        container.addEventListener('scroll', () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            const progress = (scrollTop / scrollHeight) * 100;
            document.getElementById('readerProgressBar').style.width = `${progress}%`;
        });
    },

    loadChapterContent: () => {
        const story = stories.find(s => s.id === currentStoryId);
        const container = document.getElementById('readerContentWrapper');
        
        if (!story || !story.chapters.length) {
            container.innerHTML = '<div class="empty-chapter">No hay capítulos disponibles.</div>';
            return;
        }

        const chapter = story.chapters[currentChapterIndex];
        
        // Format content paragraphs
        const formattedContent = chapter.content.split('\n')
            .map(p => p.trim() ? `<p>${p}</p>` : '')
            .join('');

        container.innerHTML = `
            <div class="reader-chapter-header">
                <h1>${chapter.title}</h1>
                <div class="chapter-meta-line"></div>
            </div>
            <div class="reader-text-body">
                ${formattedContent}
            </div>
            <div class="reader-chapter-footer">
                <i class="fa-solid fa-asterisk"></i>
            </div>
        `;

        // Scroll to top
        document.getElementById('readerContainer').scrollTop = 0;
        
        // Update Navigation UI State
        const btnPrev = document.getElementById('btnPrevChap');
        const btnNext = document.getElementById('btnNextChap');
        const chapDisplay = document.getElementById('chapNumDisplay');
        
        if(btnPrev) btnPrev.disabled = currentChapterIndex === 0;
        if(btnNext) btnNext.disabled = currentChapterIndex >= story.chapters.length - 1;
        if(chapDisplay) chapDisplay.textContent = `CAPÍTULO ${currentChapterIndex + 1}`;

        // Save progress automatically
        localStorage.setItem(`sanchez_bookmark_${currentStoryId}`, currentChapterIndex);
    },

    buildChapterPanel: () => {
        const story = stories.find(s => s.id === currentStoryId);
        const container = document.querySelector('.toc-list');
        
        if (!container) return;
        
        container.innerHTML = '';

        if (!story || !story.chapters || story.chapters.length === 0) {
            container.innerHTML = '<div class="toc-empty">Esta historia no tiene capítulos.</div>';
            return;
        }

        story.chapters.forEach((chapter, index) => {
            const item = document.createElement('div');
            item.className = `toc-item ${index === currentChapterIndex ? 'active' : ''}`;
            item.innerHTML = `<span class="toc-num">${index + 1}.</span><span class="toc-title">${chapter.title || 'Capítulo ' + (index + 1)}</span>`;
            // Preparamos el click, aunque jumpToChapter se conectará en el siguiente paso
            item.onclick = () => { if(app.jumpToChapter) app.jumpToChapter(index); };
            container.appendChild(item);
        });
    },

    toggleReaderFont: () => {
        readerPrefs.fontFamily = readerPrefs.fontFamily === 'serif' ? 'sans' : 'serif';
        app.saveReaderPrefs();
        
        const wrapper = document.getElementById('readerContentWrapper');
        if (wrapper) {
            wrapper.style.fontFamily = readerPrefs.fontFamily === 'serif' ? '"Merriweather", serif' : '"Poppins", sans-serif';
        }
    },

    adjustFontSize: (delta) => {
        let newSize = readerPrefs.fontSize + delta;
        if (newSize < 14) newSize = 14;
        if (newSize > 32) newSize = 32;
        
        readerPrefs.fontSize = newSize;
        app.saveReaderPrefs();
        
        document.getElementById('fontSizeDisplay').textContent = newSize;
        const wrapper = document.getElementById('readerContentWrapper');
        if (wrapper) wrapper.style.fontSize = `${newSize}px`;
    },

    saveReaderPrefs: () => {
        localStorage.setItem('sanchez_reader_prefs', JSON.stringify(readerPrefs));
    },

    toggleChapterPanel: (forceState = null) => {
        const sidebar = document.getElementById('readerTocSidebar');
        const backdrop = document.getElementById('readerTocBackdrop');
        const isActive = sidebar.classList.contains('active');
        const shouldOpen = forceState !== null ? forceState : !isActive;

        if (shouldOpen) {
            app.buildChapterPanel(); 
            sidebar.classList.add('active');
            backdrop.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            backdrop.classList.remove('active');
        }
    },

    jumpToChapter: (index) => {
        currentChapterIndex = index;
        app.loadChapterContent();
        app.toggleChapterPanel(false);
    },

    nextChapter: () => {
        const story = stories.find(s => s.id === currentStoryId);
        if (story && currentChapterIndex < story.chapters.length - 1) {
            currentChapterIndex++;
            // Animation effect could go here
            const container = document.getElementById('readerContentWrapper');
            container.style.opacity = '0';
            setTimeout(() => {
                app.loadChapterContent(); // Updates content and nav buttons
                app.buildChapterPanel();  // Updates TOC active state
                container.style.opacity = '1';
            }, 300);
        }
    },

    prevChapter: () => {
        if (currentChapterIndex > 0) {
            currentChapterIndex--;
            const container = document.getElementById('readerContentWrapper');
            container.style.opacity = '0';
            setTimeout(() => {
                app.loadChapterContent(); // Updates content and nav buttons
                app.buildChapterPanel();  // Updates TOC active state
                container.style.opacity = '1';
            }, 300);
        }
    },

    initLegendaryParticles: () => {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                speedY: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        function animate() {
            if (!document.body.classList.contains('reading-mode-active')) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#FFC107'; // Gold

            particles.forEach(p => {
                p.y -= p.speedY;
                if (p.y < 0) p.y = canvas.height;
                
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(animate);
        }
        animate();
    },

    toggleReaderIndex: () => {
        // Reutilizamos el modal de Lore pero solo mostrando la lista de capítulos si quisiéramos
        // Por simplicidad, usamos un prompt o alert, o podríamos abrir el modal de Lore
        // Para UX pro, abrimos el modal de Lore en la tab de Sinopsis
        app.openLoreManager(currentStoryId);
        // Shortcut to open TOC
        app.toggleChapterPanel(true);
    },

    showReaderLore: () => {
        const story = stories.find(s => s.id === currentStoryId);
        if (!story || !story.lore) {
            alert("No hay datos de archivo disponibles para esta historia.");
            return;
        }
        
        // Rellenar Terminal
        document.getElementById('termSynopsis').textContent = story.lore.synopsis || "Sin datos.";
        document.getElementById('termRules').textContent = story.lore.worldRules || "Sin datos.";
        
        // Escala de Poder
        const powerList = document.getElementById('termPowerScale');
        powerList.innerHTML = '';
        if (story.lore.powerScale) {
            const levels = story.lore.powerScale.split(',');
            levels.forEach((level, index) => {
                const cleanLevel = level.trim();
                // Determinar color basado en posición relativa
                let rankClass = 'rank-low';
                const ratio = index / levels.length;
                if (ratio > 0.3) rankClass = 'rank-mid';
                if (ratio > 0.6) rankClass = 'rank-high';
                if (cleanLevel.toLowerCase().includes('dios') || cleanLevel.toLowerCase().includes('god') || ratio > 0.9) rankClass = 'rank-god';

                const div = document.createElement('div');
                div.className = `power-bar-item ${rankClass}`;
                div.innerHTML = `
                    <span class="power-rank-name">${cleanLevel}</span>
                    <span class="power-rank-badge">Tier ${index + 1}</span>
                `;
                powerList.appendChild(div);
            });
        } else {
            powerList.innerHTML = '<p class="lore-text">No hay datos de escala.</p>';
        }

        // Álbum
        const albumGrid = document.getElementById('termAlbumGrid');
        albumGrid.innerHTML = '';
        if (story.lore.album && story.lore.album.length > 0) {
            story.lore.album.forEach(ent => {
                // Procesar ruta de imagen. After migration, paths should be correct.
                // This logic is a fallback for bare filenames.
                let imageSrc = ent.url;
                if (imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('data:') && !imageSrc.includes('/')) {
                    // Only prepend path if it's a simple filename like "m1.png"
                    imageSrc = `../assets/img/historias/album/${imageSrc}`;
                }

                const card = document.createElement('div');
                card.className = `gallery-card rarity-${ent.rarity}`;
                card.innerHTML = `
                    <img src="${imageSrc}" class="gallery-img" onerror="this.src='${FALLBACK_COVER}'">
                    <div class="gallery-overlay">
                        <div class="gallery-info">
                            <span class="gallery-name">${ent.name}</span>
                            <span class="gallery-desc">${ent.desc}</span>
                        </div>
                    </div>
                `;
                albumGrid.appendChild(card);
            });
        } else {
            albumGrid.innerHTML = '<p class="lore-text" style="grid-column: 1/-1; text-align:center;">No hay imágenes en la galería.</p>';
        }

        document.getElementById('readerLoreOverlay').style.display = 'flex';
    },

    closeReaderLore: () => {
        document.getElementById('readerLoreOverlay').style.display = 'none';
    },

    renderLibrary: () => {
        const grid = document.getElementById('storiesGrid');
        if (!grid) return;

        if (stories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-book-skull empty-icon"></i>
                    <p>El archivo de crónicas está vacío.<br>Comienza tu primera aventura.</p>
                </div>`;
            return;
        }

        grid.innerHTML = stories.map(story => `
            <div class="story-card-v2" id="story-${story.id}">
                <div class="quick-edit-overlay"></div>
                
                <div class="card-actions">
                    <button class="action-btn delete-btn" onclick="event.stopPropagation(); app.deleteStory(${story.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div>

                <div class="story-cover-wrapper">
                    <img src="${story.cover || FALLBACK_COVER}" class="story-cover-img" onerror="this.src='${FALLBACK_COVER}'">
                    <span class="genre-tag">${story.genre}</span>
                    <div class="chapter-badge">
                        <i class="fa-solid fa-layer-group"></i> Capítulos: ${story.chapters.length}
                    </div>
                </div>
                <div class="story-info-v2" onclick="app.openReader(${story.id})">
                    <h3 class="story-title-v2">${story.title}</h3>
                    <small style="color:var(--text-muted); display:block; margin-bottom:0.5rem;">${story.createdAt}</small>
                </div>
                
                <!-- Action Bar -->
                <div class="story-actions-bar">
                    <button class="story-btn btn-read" onclick="app.openReader(${story.id})"><i class="fa-solid fa-book-open"></i> Leer</button>
                    <button class="story-btn btn-add-chap" onclick="app.openChapterManager(${story.id})"><i class="fa-solid fa-plus"></i> Capítulos</button>
                    <button class="story-btn btn-lore" onclick="app.openLoreManager(${story.id})"><i class="fa-solid fa-database"></i> Lore</button>
                    <button class="story-btn" onclick="app.toggleStoryQuickEdit(${story.id}, this)" title="Edición Rápida" style="flex: 0 0 36px; background: rgba(84, 165, 212, 0.15); color: var(--secondary-color); border: 1px solid rgba(84, 165, 212, 0.2);">
                        <i class="fa-solid fa-bolt"></i>
                    </button>
                    <button class="story-btn btn-export-card" onclick="app.exportStory(${story.id})" title="Exportar JSON">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', app.init);