/**
 * Stories Engine - SanchezCabron OS
 * Sistema de gestión de historias por capítulos (Wattpad Style).
 */

const STORIES_KEY = 'sanchez_stories_v2';
const FALLBACK_COVER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23475569' font-family='sans-serif' font-size='20'%3ENO COVER%3C/text%3E%3C/svg%3E";

let stories = [];
let currentStoryId = null; // Para saber qué historia estamos editando/leyendo
let currentChapterIndex = 0; // Índice del capítulo actual en lectura

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

        currentStoryId = id;
        const savedIndex = localStorage.getItem(`sanchez_bookmark_${id}`);
        currentChapterIndex = savedIndex ? parseInt(savedIndex) : 0;

        app.renderBookPage();
        document.getElementById('readerOverlay').style.display = 'flex';
    },

    closeReader: () => {
        document.getElementById('readerOverlay').style.display = 'none';
    },

    renderBookPage: () => {
        const story = stories.find(s => s.id === currentStoryId);
        if (!story || !story.chapters.length) {
            document.getElementById('pageRightContent').innerHTML = '<p style="text-align:center; margin-top:50%;">No hay capítulos disponibles.</p>';
            return;
        }

        // Validar índice
        if (currentChapterIndex < 0) currentChapterIndex = 0;
        if (currentChapterIndex >= story.chapters.length) currentChapterIndex = story.chapters.length - 1;

        const chapter = story.chapters[currentChapterIndex];
        
        // --- PÁGINA IZQUIERDA (Portada / Info) ---
        const leftHTML = `
            <div class="book-title-page">
                <img src="${story.cover || FALLBACK_COVER}" class="book-cover-mini">
                <h2 style="color:var(--primary-color); margin-bottom:0.5rem;">${story.title}</h2>
                <div style="width:50px; height:2px; background:var(--accent-color); margin: 1rem auto;"></div>
                <h3 style="color:#888;">${chapter.title}</h3>
                <p style="font-size:0.9rem; color:#666; margin-top:2rem;">
                    Capítulo ${currentChapterIndex + 1} de ${story.chapters.length}
                </p>
            </div>
        `;
        document.getElementById('pageLeftContent').innerHTML = leftHTML;

        // --- PÁGINA DERECHA (Texto) ---
        const formattedContent = chapter.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
        
        const rightHTML = `
            <h2 class="chapter-title-large">${chapter.title}</h2>
            <div class="chapter-body">${formattedContent}</div>
        `;
        
        const rightContainer = document.getElementById('pageRightContent');
        rightContainer.innerHTML = rightHTML;
        rightContainer.scrollTop = 0; // Reset scroll

        // Actualizar UI
        document.getElementById('pageNumberDisplay').textContent = currentChapterIndex + 1;
        document.getElementById('readerProgress').textContent = `Capítulo ${currentChapterIndex + 1}/${story.chapters.length}`;
        
        // Estado del Marcapáginas
        const savedIndex = localStorage.getItem(`sanchez_bookmark_${currentStoryId}`);
        const ribbon = document.getElementById('bookmarkRibbon');
        if (savedIndex && parseInt(savedIndex) === currentChapterIndex) {
            ribbon.classList.add('active');
        } else {
            ribbon.classList.remove('active');
        }
    },

    nextChapter: () => {
        const story = stories.find(s => s.id === currentStoryId);
        if (story && currentChapterIndex < story.chapters.length - 1) {
            const book = document.getElementById('book3d');
            book.classList.add('anim-flip-next');
            
            setTimeout(() => {
                currentChapterIndex++;
                app.renderBookPage();
                book.classList.remove('anim-flip-next');
            }, 300); // Mitad de la animación (0.6s)
        }
    },

    prevChapter: () => {
        if (currentChapterIndex > 0) {
            const book = document.getElementById('book3d');
            book.classList.add('anim-flip-prev');
            
            setTimeout(() => {
                currentChapterIndex--;
                app.renderBookPage();
                book.classList.remove('anim-flip-prev');
            }, 300);
        }
    },

    toggleBookmark: () => {
        const ribbon = document.getElementById('bookmarkRibbon');
        if (ribbon.classList.contains('active')) {
            localStorage.removeItem(`sanchez_bookmark_${currentStoryId}`);
            ribbon.classList.remove('active');
        } else {
            localStorage.setItem(`sanchez_bookmark_${currentStoryId}`, currentChapterIndex);
            ribbon.classList.add('active');
            // Pequeña animación visual
            ribbon.style.transform = 'scale(1.2)';
            setTimeout(() => ribbon.style.transform = 'scale(1)', 200);
        }
    },

    toggleReaderIndex: () => {
        // Reutilizamos el modal de Lore pero solo mostrando la lista de capítulos si quisiéramos
        // Por simplicidad, usamos un prompt o alert, o podríamos abrir el modal de Lore
        // Para UX pro, abrimos el modal de Lore en la tab de Sinopsis
        app.openLoreManager(currentStoryId);
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
                // Procesar ruta de imagen: si es solo nombre, buscar en img/historias/album/
                let imageSrc = ent.url;
                if (imageSrc && !imageSrc.startsWith('http') && !imageSrc.startsWith('data:') && !imageSrc.startsWith('img/')) {
                    imageSrc = `img/historias/album/${imageSrc}`;
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