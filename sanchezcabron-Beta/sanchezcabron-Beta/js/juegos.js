/**
 * Game Library - SanchezCabron OS
 * Rebuilt Logic: Zero Errors Philosophy
 * Clave de persistencia: mis_juegos_db
 */

const STORAGE_KEY = 'mis_juegos_db';
const FALLBACK_GAME_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='184' height='69' viewBox='0 0 184 69'%3E%3Crect width='184' height='69' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-family='sans-serif' font-size='14'%3ENO COVER%3C/text%3E%3C/svg%3E";

let gamesData = [];
let editingGameId = null;
let quickEditingGameId = null;

// Cache del DOM para mejorar rendimiento
const dom = {};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Asignación de Elementos
    dom.grid = document.getElementById('gamesGrid');
    dom.modal = document.getElementById('formModal');
    dom.form = document.getElementById('gameForm');
    dom.saveBtn = document.getElementById('btnGuardarJuego');
    dom.addBtn = document.getElementById('addGameBtn');
    dom.closeBtn = document.getElementById('closeModalBtn');
    
    // Contenedor de errores dinámico
    if (dom.form) {
        let errorDiv = document.createElement('div');
        errorDiv.id = 'formErrorMsg';
        errorDiv.style.cssText = 'color: #ff4d4d; background: rgba(255,0,0,0.1); padding: 10px; border-radius: 4px; margin-bottom: 15px; display: none; font-weight: bold; border: 1px solid #ff4d4d;';
        dom.form.prepend(errorDiv);
        dom.errorMsg = errorDiv;
    }

    // 2. Carga Inicial
    cargarJuegos();
    setupEventListeners();
    renderizarJuegos();

    // Check for URL params to open a drawer from global search
    const urlParams = new URLSearchParams(window.location.search);
    const gameIdToOpen = urlParams.get('gameId');
    if (gameIdToOpen) {
        // Use a timeout to ensure the DOM is fully ready and rendered
        setTimeout(() => openDrawer(parseInt(gameIdToOpen)), 300);
    }
});

function cargarJuegos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            gamesData = JSON.parse(stored);

            // Data migration for image paths from old 'img/' structure
            let needsSave = false;
            gamesData.forEach(game => {
                if (game.cover && game.cover.startsWith('img/')) {
                    game.cover = `../assets/${game.cover}`; // e.g., 'img/juegos/file.jpg' -> '../assets/img/juegos/file.jpg'
                    needsSave = true;
                }
            });
            if (needsSave) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesData));
            }

        }
    } catch (e) {
        console.error('❌ Error crítico leyendo localStorage:', e);
        gamesData = [];
    }
}

function setupEventListeners() {
    // Botones principales
    if (dom.addBtn) dom.addBtn.addEventListener('click', () => openModal());
    if (dom.closeBtn) dom.closeBtn.addEventListener('click', closeModal);
    
    // Lógica de Guardado (Vinculada al ID específico como solicitado)
    if (dom.saveBtn) {
        dom.saveBtn.addEventListener('click', guardarJuego);
    } 
    // Prevenir submit estándar si el usuario da Enter
    if (dom.form) {
        dom.form.addEventListener('submit', guardarJuego);
    }

    // Inputs dinámicos
    const metaInput = document.getElementById('metacriticInput');
    if (metaInput) metaInput.addEventListener('input', updateMetacriticColor);
    
    const statusInput = document.getElementById('statusInput');
    if (statusInput) statusInput.addEventListener('change', toggleProgressField);

    // Cerrar Drawer
    document.getElementById('closeDrawerBtn')?.addEventListener('click', () => {
        document.getElementById('detailsDrawer').classList.remove('open');
    });
}

function toggleGameQuickEdit(id, btn) {
    const card = btn.closest('.game-card');
    const isEditing = card.classList.contains('quick-edit-mode');

    if (quickEditingGameId && quickEditingGameId !== id) {
        const otherCard = document.querySelector(`.game-card.quick-edit-mode`);
        if (otherCard) cancelGameQuickEdit(quickEditingGameId, otherCard);
    }

    if (isEditing) {
        cancelGameQuickEdit(id, card);
    } else {
        quickEditingGameId = id;
        const game = gamesData.find(g => g.id === id);
        if (!game) return;

        card.classList.add('quick-edit-mode');
        const overlay = card.querySelector('.quick-edit-overlay');

        overlay.innerHTML = `
            <label style="font-size: 0.8rem; color: var(--text-muted);">Estado</label>
            <select id="quick-edit-status-${id}" class="quick-edit-input">
                <option value="Pendiente" ${game.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="Jugando" ${game.status === 'Jugando' ? 'selected' : ''}>Jugando</option>
                <option value="Completado" ${game.status === 'Completado' ? 'selected' : ''}>Completado</option>
                <option value="Abandonado" ${game.status === 'Abandonado' ? 'selected' : ''}>Abandonado</option>
            </select>
            <label style="font-size: 0.8rem; color: var(--text-muted);">Puntuación</label>
            <input type="number" id="quick-edit-score-${id}" class="quick-edit-input" value="${game.metacritic}" min="0" max="100">
            <div class="quick-edit-actions">
                <button class="quick-edit-btn quick-edit-cancel" onclick="event.stopPropagation(); cancelGameQuickEdit(${id})"><i class="fa-solid fa-xmark"></i></button>
                <button class="quick-edit-btn quick-edit-confirm" onclick="event.stopPropagation(); saveGameQuickEdit(${id})"><i class="fa-solid fa-check"></i></button>
            </div>
        `;

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveGameQuickEdit(id);
            } else if (e.key === 'Escape') {
                cancelGameQuickEdit(id);
            }
        });
        
        overlay.querySelector('select').focus();
    }
}

function saveGameQuickEdit(id) {
    const card = document.querySelector(`.game-card[data-game-id="${id}"]`);
    if (!card) return;

    const newStatus = card.querySelector(`#quick-edit-status-${id}`).value;
    const newScore = parseInt(card.querySelector(`#quick-edit-score-${id}`).value);

    const index = gamesData.findIndex(g => g.id === id);
    if (index !== -1) {
        gamesData[index].status = newStatus;
        gamesData[index].metacritic = newScore;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesData));
        renderizarJuegos(); // Re-render the whole list
    }
    quickEditingGameId = null;
}

function cancelGameQuickEdit(id, cardElement) {
    const card = cardElement || document.querySelector(`.game-card[data-game-id="${id}"]`);
    if (card) {
        card.classList.remove('quick-edit-mode');
        const overlay = card.querySelector('.quick-edit-overlay');
        overlay.innerHTML = '';
    }
    quickEditingGameId = null;
}

function guardarJuego(e) {
    // 1. Prevenir recarga
    e.preventDefault();

    // 2. Captura de datos
    const formData = new FormData(dom.form);
    const name = formData.get('nameInput')?.trim();
    const metacritic = formData.get('metacriticInput')?.trim();
    const rawCover = formData.get('coverInput')?.trim();
    
    // 3. Validación Estricta
    if (!name || metacritic === '') {
        if(dom.errorMsg) {
            dom.errorMsg.textContent = "❌ Error: El nombre y la puntuación Metacritic son obligatorios.";
            dom.errorMsg.style.display = 'block';
        }
        return; // Detener ejecución
    }

    // 4. Procesamiento de Ruta de Imagen
    let finalCover = null;
    if (rawCover) {
        // Si es URL o DataURI, se deja igual. Si es solo nombre, se asume local.
        finalCover = (rawCover.startsWith('http') || rawCover.startsWith('data:')) 
            ? rawCover 
            : `../assets/img/juegos/${rawCover}`;
    }

    const gameData = {
        id: editingGameId || Date.now(),
        name: name,
        metacritic: parseInt(metacritic, 10),
        estimatedTime: formData.get('timeInput') || 'N/A',
        status: formData.get('statusInput'),
        releaseYear: parseInt(formData.get('yearInput'), 10) || null,
        progress: parseInt(formData.get('progressInput'), 10) || 0,
        cover: finalCover
    };

    // 5. Actualización del Array
    if (editingGameId) {
        const index = gamesData.findIndex(g => g.id === editingGameId);
        if (index !== -1) {
            // Mantener portada anterior si no se especifica una nueva
            if (!gameData.cover) gameData.cover = gamesData[index].cover;
            gamesData[index] = gameData;
        }
    } else {
        gamesData.push(gameData);
    }
    
    // 6. Persistencia y Limpieza
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesData));
    renderizarJuegos();
    closeModal(); // Esto resetea el formulario también
    
    // 7. Integración opcional con logros
    if (typeof checkAchievements === 'function') checkAchievements();
}

function renderizarJuegos() {
    if (!dom.grid) return;

    let gamesToRender = [...gamesData];
    gamesToRender.sort((a, b) => b.id - a.id); // Más recientes primero

    if (gamesToRender.length === 0) {
        dom.grid.innerHTML = `<p class="empty-state" style="text-align:center; grid-column: 1 / -1;">No hay juegos en la biblioteca.</p>`;
        return;
    }
    
    dom.grid.innerHTML = gamesToRender.map(game => {
        // Lógica de color Metacritic
        let scoreClass = 'score-none';
        const score = game.metacritic;
        if (score >= 75) scoreClass = 'score-green';
        else if (score >= 50) scoreClass = 'score-yellow';
        else if (score > 0) scoreClass = 'score-red';

        // Barra de progreso si está jugando
        const progressHTML = game.status === 'Jugando' ? `
            <div class="game-card-progress-bar">
                <div class="game-card-progress-fill" style="width: ${game.progress || 0}%"></div>
            </div>
        ` : '';

        return `
            <div class="game-card" data-game-id="${game.id}">
                <div class="quick-edit-overlay"></div>
                <img src="${game.cover || FALLBACK_GAME_IMG}" 
                     alt="${game.name}" 
                     class="game-card-img" 
                     onerror="this.onerror=null; this.src='${FALLBACK_GAME_IMG}';"
                     onclick="openDrawer(${game.id})">
                
                <div class="game-card-info" onclick="openDrawer(${game.id})">
                    <span class="game-card-title">${game.name}</span>
                    <div class="game-card-meta">
                        <span>${game.status}</span>
                        <span><i class="fa-regular fa-clock"></i> ${game.estimatedTime}</span>
                    </div>
                    ${progressHTML}
                </div>
                
                <div class="game-card-score ${scoreClass}" onclick="openDrawer(${game.id})">
                    ${game.metacritic || '-'}
                </div>

                <div class="card-actions" style="position: absolute; top: 50%; right: 10px; transform: translateY(-50%); z-index: 5;">
                    <button class="action-btn quick-edit-trigger" onclick="event.stopPropagation(); toggleGameQuickEdit(${game.id}, this)" title="Edición Rápida"><i class="fa-solid fa-bolt"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

// --- Gestión del Modal ---

function openModal(gameId = null) {
    dom.form.reset();
    if (dom.errorMsg) dom.errorMsg.style.display = 'none';
    updateMetacriticColor();
    toggleProgressField();

    if (gameId) {
        editingGameId = gameId;
        const game = gamesData.find(g => g.id === gameId);
        if (game) {
            document.getElementById('modalTitle').textContent = 'Editar Juego';
            document.getElementById('nameInput').value = game.name;
            
            // Limpiar ruta para mostrar solo nombre si es local
            let cleanCover = game.cover || '';
            if (cleanCover.startsWith('../assets/img/juegos/')) cleanCover = cleanCover.replace('../assets/img/juegos/', '');
            document.getElementById('coverInput').value = cleanCover;
            
            document.getElementById('metacriticInput').value = game.metacritic;
            document.getElementById('timeInput').value = game.estimatedTime;
            document.getElementById('statusInput').value = game.status;
            document.getElementById('yearInput').value = game.releaseYear;
            document.getElementById('progressInput').value = game.progress;
            
            updateMetacriticColor();
            toggleProgressField();
        }
    } else {
        editingGameId = null;
        document.getElementById('modalTitle').textContent = 'Añadir Nuevo Juego';
    }
    dom.modal.style.display = 'flex';
}

function closeModal() {
    dom.modal.style.display = 'none';
    dom.form.reset();
    editingGameId = null;
}

// --- Drawer de Detalles ---

function openDrawer(gameId) {
    const game = gamesData.find(g => g.id === gameId);
    if (!game) return;

    const drawer = document.getElementById('detailsDrawer');
    document.getElementById('drawerTitle').textContent = game.name;
    document.getElementById('drawerCover').src = game.cover || FALLBACK_GAME_IMG;
    document.getElementById('drawerStatus').textContent = game.status;
    document.getElementById('drawerMetacritic').textContent = game.metacritic || 'N/A';
    document.getElementById('drawerTime').textContent = game.estimatedTime || 'N/A';
    document.getElementById('drawerYear').textContent = game.releaseYear || 'N/A';
    
    // Mostrar progreso solo si está jugando
    const progressDrawer = document.getElementById('drawerProgress');
    if (game.status === 'Jugando') {
        progressDrawer.style.display = 'block';
        document.getElementById('drawerProgressPercent').textContent = `${game.progress || 0}%`;
    } else {
        progressDrawer.style.display = 'none';
    }

    // Botones del Drawer
    document.getElementById('drawerEditBtn').onclick = () => {
        drawer.classList.remove('open');
        openModal(game.id);
    };
    
    document.getElementById('drawerDeleteBtn').onclick = () => {
        if (confirm('¿Estás seguro de eliminar este juego?')) {
            gamesData = gamesData.filter(g => g.id !== gameId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesData));
            renderizarJuegos();
            drawer.classList.remove('open');
        }
    };

    drawer.classList.add('open');
}

// --- Helpers Visuales ---

function updateMetacriticColor() {
    const input = document.getElementById('metacriticInput');
    const indicator = document.getElementById('metacriticColorIndicator');
    if (!input || !indicator) return;

    const value = parseInt(input.value, 10);
    let color = '#333';
    if (value >= 75) color = '#6c3';
    else if (value >= 50) color = '#fc3';
    else if (value > 0) color = '#f00';
    indicator.style.backgroundColor = color;
}

function toggleProgressField() {
    const status = document.getElementById('statusInput').value;
    const group = document.getElementById('progressGroup');
    if (group) {
        group.style.display = (status === 'Jugando') ? 'block' : 'none';
    }
}

// Exponer funciones globales para el HTML
window.openDrawer = openDrawer;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleGameQuickEdit = toggleGameQuickEdit;
window.saveGameQuickEdit = saveGameQuickEdit;
window.cancelGameQuickEdit = cancelGameQuickEdit;

// --- Integración de Logros (Opcional) ---
function checkAchievements() {
    if (typeof desbloquearLogro !== 'function') return;

    if (gamesData.length >= 1) desbloquearLogro('games_add_1');
    if (gamesData.length >= 7) desbloquearLogro('games_gen_52'); // Corregido: el logro es para 7 juegos.
    
    const completed = gamesData.filter(g => g.status === 'Completado').length;
    if (completed >= 10) desbloquearLogro('games_pro_10');
}