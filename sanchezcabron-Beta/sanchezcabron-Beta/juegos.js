/**
 * Game Library - SanchezCabron OS
 * Rebuilt Logic: Zero Errors Philosophy
 * Clave de persistencia: mis_juegos_db
 */

const STORAGE_KEY = 'mis_juegos_db';
const FALLBACK_GAME_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='184' height='69' viewBox='0 0 184 69'%3E%3Crect width='184' height='69' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-family='sans-serif' font-size='14'%3ENO COVER%3C/text%3E%3C/svg%3E";

let gamesData = [];
let currentFilter = 'all';
let editingGameId = null;

// Cache del DOM para mejorar rendimiento
const dom = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Juegos Iniciado: Modo "Zero Errors" activado.');
    
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
    console.log('🔧 Estableciendo event listeners...');
    setupEventListeners();
    renderizarJuegos();
});

function cargarJuegos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            gamesData = JSON.parse(stored);
            console.log(`✅ Datos cargados: ${gamesData.length} juegos.`);
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

    // Filtros
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderizarJuegos();
        });
    });

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

function guardarJuego(e) {
    // 1. Prevenir recarga
    e.preventDefault();
    console.log('💾 Iniciando proceso de guardado...');

    // 2. Captura de datos
    const formData = new FormData(dom.form);
    const name = formData.get('nameInput')?.trim();
    const metacritic = formData.get('metacriticInput')?.trim();
    const rawCover = formData.get('coverInput')?.trim();
    
    // 3. Validación Estricta
    if (!name || metacritic === '') {
        console.warn('⚠️ Validación fallida: Faltan campos.');
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
            : `img/juegos/${rawCover}`;
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
            console.log('✏️ Juego editado:', gameData.name);
        }
    } else {
        gamesData.push(gameData);
        console.log('➕ Nuevo juego añadido:', gameData.name);
    }
    
    // 6. Persistencia y Limpieza
    console.log('💾 Persistiendo datos en localStorage...');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesData));
    renderizarJuegos();
    closeModal(); // Esto resetea el formulario también
    
    // 7. Integración opcional con logros
    if (typeof checkAchievements === 'function') checkAchievements();
}

function renderizarJuegos() {
    if (!dom.grid) return;
    console.log('🎨 Renderizando juegos...');

    let gamesToRender = [...gamesData];

    // Filtros
    if (currentFilter === 'completed') {
        gamesToRender = gamesToRender.filter(g => g.status === 'Completado');
    } else if (currentFilter === 'top-rated') {
        gamesToRender.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
    } else {
        gamesToRender.sort((a, b) => b.id - a.id); // Más recientes primero
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
            <div class="game-card" onclick="openDrawer(${game.id})">
                <img src="${game.cover || FALLBACK_GAME_IMG}" 
                     alt="${game.name}" 
                     class="game-card-img" 
                     onerror="this.onerror=null; this.src='${FALLBACK_GAME_IMG}';">
                
                <div class="game-card-info">
                    <span class="game-card-title">${game.name}</span>
                    <div class="game-card-meta">
                        <span>${game.status}</span>
                        <span><i class="fa-regular fa-clock"></i> ${game.estimatedTime}</span>
                    </div>
                    ${progressHTML}
                </div>
                
                <div class="game-card-score ${scoreClass}">
                    ${game.metacritic || '-'}
                </div>
            </div>
        `;
    }).join('');
}

// --- Gestión del Modal ---

function openModal(gameId = null) {
    console.log(`📬 Abriendo modal. ID de juego para editar: ${gameId || 'ninguno (nuevo juego)'}`);
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
            if (cleanCover.startsWith('img/juegos/')) cleanCover = cleanCover.replace('img/juegos/', '');
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
    console.log('📪 Cerrando y reseteando modal.');
    dom.modal.style.display = 'none';
    dom.form.reset();
    editingGameId = null;
}

// --- Drawer de Detalles ---

function openDrawer(gameId) {
    console.log(`📖 Abriendo drawer de detalles para el juego ID: ${gameId}`);
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

// --- Integración de Logros (Opcional) ---
function checkAchievements() {
    if (typeof desbloquearLogro !== 'function') return;

    if (gamesData.length >= 1) desbloquearLogro('games_add_1');
    if (gamesData.length >= 7) desbloquearLogro('games_gen_52'); // Corregido: el logro es para 7 juegos.
    
    const completed = gamesData.filter(g => g.status === 'Completado').length;
    if (completed >= 10) desbloquearLogro('games_pro_10');
}