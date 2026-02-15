/**
 * Stories Engine - SanchezCabron OS
 * Sistema de gestión de historias por capítulos (Wattpad Style).
 */

const STORIES_KEY = 'sanchez_stories_v2';
const FALLBACK_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='sans-serif' font-size='20'%3ENO COVER%3C/text%3E%3C/svg%3E";

let stories = [];
let currentStoryId = null; // Para saber qué historia estamos editando/leyendo

const app = {
    init: () => {
        console.log('📖 Motor de Historias Iniciado');
        app.loadStories();
        app.setupEventListeners();
        app.renderLibrary();
    },

    loadStories: () => {
        const stored = localStorage.getItem(STORIES_KEY);
        if (stored) {
            stories = JSON.parse(stored);
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
            cover = `img/historias/${coverInput}`;
        }

        const newStory = {
            id: Date.now(),
            title,
            genre,
            cover: cover || '',
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
        if (confirm('¿Borrar esta historia y todos sus capítulos?')) {
            stories = stories.filter(s => s.id !== id);
            app.saveStories();
        }
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
            story.lore = { synopsis: '', powerScale: '', worldRules: '', characters: [] };
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

    saveLore: () => {
        if (!currentStoryId) return;
        const story = stories.find(s => s.id === currentStoryId);
        
        // Recopilar personajes
        const charRows = document.querySelectorAll('.character-row');
        const characters = Array.from(charRows).map(row => ({
            name: row.querySelector('.char-name').value,
            desc: row.querySelector('.char-desc').value
        })).filter(c => c.name.trim() !== ''); // Filtrar vacíos

        story.lore = {
            synopsis: document.getElementById('loreSynopsis').value,
            powerScale: document.getElementById('lorePowerScale').value,
            worldRules: document.getElementById('loreWorldRules').value,
            characters: characters
        };

        app.saveStories();
        document.getElementById('loreModal').style.display = 'none';
        alert('Archivo de Datos actualizado.');
    },

    // --- PORTABILIDAD DE DATOS (IMPORT/EXPORT) ---

    exportStory: (id) => {
        const story = stories.find(s => s.id === id);
        if (!story) return;
        
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

        document.getElementById('readerStoryTitle').textContent = story.title;
        const sidebar = document.getElementById('readerSidebar');
        const contentArea = document.getElementById('readerContent');

        // Generar Sidebar
        if (story.chapters.length === 0) {
            sidebar.innerHTML = '<p style="color:#666; padding:1rem;">No hay capítulos aún.</p>';
            contentArea.innerHTML = '<div style="text-align:center; margin-top:5rem; color:#666;"><h3>Historia en construcción</h3><p>El autor aún no ha publicado capítulos.</p></div>';
        } else {
            sidebar.innerHTML = story.chapters.map((chap, index) => `
                <div class="chapter-link" onclick="app.loadChapterContent(${id}, ${index}, this)">
                    ${index + 1}. ${chap.title}
                </div>
            `).join('');
            
            // Cargar el primero por defecto
            app.loadChapterContent(id, 0, sidebar.querySelector('.chapter-link'));
        }

        document.getElementById('readerOverlay').style.display = 'flex';
    },

    closeReader: () => {
        document.getElementById('readerOverlay').style.display = 'none';
    },

    loadChapterContent: (storyId, chapterIndex, element) => {
        const story = stories.find(s => s.id === storyId);
        const chapter = story.chapters[chapterIndex];
        
        // Highlight sidebar
        document.querySelectorAll('.chapter-link').forEach(el => el.classList.remove('active'));
        if(element) element.classList.add('active');

        // Render Content (convertir saltos de línea a párrafos)
        const formattedContent = chapter.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
        
        document.getElementById('readerContent').innerHTML = `
            <h2>${chapter.title}</h2>
            <div class="chapter-body">${formattedContent}</div>
        `;
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
            <div class="story-card-v2">
                <div class="story-cover-wrapper">
                    <img src="${story.cover || FALLBACK_COVER}" class="story-cover-img" onerror="this.src='${FALLBACK_COVER}'">
                    <span class="genre-tag">${story.genre}</span>
                    <div class="chapter-badge">
                        <i class="fa-solid fa-layer-group"></i> Capítulos: ${story.chapters.length}
                    </div>
                </div>
                <div class="story-info-v2">
                    <h3 class="story-title-v2">${story.title}</h3>
                    <small style="color:var(--text-muted); display:block; margin-bottom:0.5rem;">${story.createdAt}</small>
                </div>
                
                <!-- Action Bar -->
                <div class="story-actions-bar">
                    <button class="story-btn btn-read" onclick="app.openReader(${story.id})"><i class="fa-solid fa-book-open"></i> Leer</button>
                    <button class="story-btn btn-add-chap" onclick="app.openChapterManager(${story.id})"><i class="fa-solid fa-plus"></i> Capítulos</button>
                    <button class="story-btn btn-lore" onclick="app.openLoreManager(${story.id})"><i class="fa-solid fa-database"></i> Lore</button>
                    <button class="story-btn btn-export-card" onclick="app.exportStory(${story.id})" title="Exportar JSON">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button class="story-btn btn-delete-story" onclick="app.deleteStory(${story.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
};

document.addEventListener('DOMContentLoaded', app.init);