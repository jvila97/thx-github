/**
 * Sistema de Logros - SanchezCabron OS
 * Gamificación completa con 100 logros.
 */

const LOGROS_KEY = 'sanchez_logros_v1';
const STATS_KEY = 'sanchez_stats_v1';

// --- 1. Definición de los 100 Logros ---
const ACHIEVEMENTS = [];

// Helper para generar logros rápidamente
function addAch(id, title, desc, icon, category) {
    ACHIEVEMENTS.push({ id, title, desc, icon, category });
}

// Categoría 1: Web (1-20)
addAch('web_login', 'Primer Logueo', 'Inicia la aplicación por primera vez.', 'fa-solid fa-power-off', 'web');
addAch('web_night', 'Explorador Nocturno', 'Usa la web entre las 3:00 y las 4:00 AM.', 'fa-solid fa-moon', 'web');
addAch('web_loyal_5', 'Fiel', 'Entra 5 días seguidos.', 'fa-solid fa-calendar-check', 'web');
addAch('web_clicker_100', 'Clicker', 'Haz 100 clicks en la página de inicio.', 'fa-solid fa-computer-mouse', 'web');
addAch('web_scroller', 'Scroller', 'Haz scroll hasta el final de una página.', 'fa-solid fa-arrow-down', 'web');
for(let i=6; i<=20; i++) addAch(`web_gen_${i}`, `Navegante ${i}`, `Visita la web ${i*5} veces.`, 'fa-solid fa-globe', 'web');

// Categoría 2: Series (21-45)
addAch('series_add_1', 'Comienzo', 'Añade tu primera serie.', 'fa-solid fa-tv', 'series');
addAch('series_critic_10', 'Crítico', 'Escribe 10 sinopsis.', 'fa-solid fa-pen-nib', 'series');
addAch('series_marathon_5', 'Maratoniano', 'Marca 5 series como "Visto".', 'fa-solid fa-person-running', 'series');
addAch('series_fanboy', 'Fanboy', 'Puntúa 3 series con un 10.', 'fa-solid fa-heart', 'series');
addAch('series_archivist_50', 'Archivista', 'Ten 50 series en tu lista.', 'fa-solid fa-box-archive', 'series');
addAch('series_simulcast', 'Al Día', 'Ten una serie en estado Simulcast.', 'fa-solid fa-satellite-dish', 'series');
addAch('series_drop', 'Sin Piedad', 'Abandona una serie.', 'fa-solid fa-trash', 'series');
for(let i=28; i<=45; i++) addAch(`series_gen_${i}`, `Seriéfilo ${i}`, `Acumula ${i*10} horas de visualización.`, 'fa-solid fa-clock', 'series');

// Categoría 3: Juegos (46-70)
addAch('games_add_1', 'Primer Juego', 'Añade tu primer juego a la biblioteca.', 'fa-solid fa-plus-square', 'games');
addAch('games_pro_10', 'Gamer Pro', 'Completa 10 juegos.', 'fa-solid fa-gamepad', 'games');
addAch('games_retro', 'Nostálgico', 'Añade un juego lanzado antes del 2000.', 'fa-solid fa-floppy-disk', 'games');
addAch('games_platinum', 'Platino', 'Edita todos los detalles de un juego.', 'fa-solid fa-trophy', 'games');
addAch('games_metacritic_90', 'Obra Maestra', 'Añade un juego con 90 o más de Metacritic.', 'fa-solid fa-award', 'games');
addAch('games_backlog_10', 'Backlog Infinito', 'Ten 10 juegos en estado "Pendiente".', 'fa-solid fa-layer-group', 'games');
for(let i=52; i<=70; i++) addAch(`games_gen_${i}`, `Jugador ${i}`, `Añade ${i-45} juegos a la biblioteca.`, 'fa-solid fa-chess-board', 'games');

// Categoría 4: Bóveda (71-85)
addAch('vault_enter', 'El Elegido', 'Entra en la bóveda correctamente.', 'fa-solid fa-unlock', 'vault');
addAch('vault_romantic', 'Romántico', 'Escucha 5 canciones en la Playlist.', 'fa-solid fa-music', 'vault');
addAch('vault_fail_3', 'Persistente', 'Falla el código de la bóveda 3 veces.', 'fa-solid fa-user-shield', 'vault');
addAch('vault_confetti', 'Fiesta', 'Lanza confeti en la página secreta.', 'fa-solid fa-party-horn', 'vault');
for(let i=75; i<=85; i++) addAch(`vault_gen_${i}`, `Guardián ${i}`, `Visita la bóveda ${i-70} veces.`, 'fa-solid fa-shield-halved', 'vault');

// Categoría 5: Secretos y Futuro (86-100)
addAch('secret_hacker', 'Hacker', 'Abre la consola del navegador (F12) y escribe unlockHacker().', 'fa-solid fa-terminal', 'secret');
addAch('secret_beta', 'Beta Tester', 'Usa la web en el año 2026.', 'fa-solid fa-robot', 'secret');
addAch('secret_gold', 'Coleccionista de Oro', 'Desbloquea 90 logros.', 'fa-solid fa-crown', 'secret');
addAch('secret_konami', 'Konami Code', 'Haz clic 10 veces en el logo.', 'fa-solid fa-code', 'secret');
for(let i=90; i<=100; i++) addAch(`secret_gen_${i}`, `Misterio ${i}`, `Logro oculto #${i}.`, 'fa-solid fa-mask', 'secret');

// --- 2. Gestión de Estado ---

// Obtener logros desbloqueados
function getUnlockedAchievements() {
    return JSON.parse(localStorage.getItem(LOGROS_KEY) || '[]');
}

// Obtener estadísticas
function getStats() {
    return JSON.parse(localStorage.getItem(STATS_KEY) || '{"clicks":0, "logins":0, "lastLogin":null, "consecutiveDays":0, "vaultFails":0}');
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// --- 3. Lógica de Desbloqueo ---

function desbloquearLogro(id) {
    const unlocked = getUnlockedAchievements();
    
    // Si ya lo tiene, salir
    if (unlocked.some(u => u.id === id)) return;

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
        // Guardar con fecha
        const unlockData = {
            id: id,
            date: new Date().toLocaleDateString()
        };
        unlocked.push(unlockData);
        localStorage.setItem(LOGROS_KEY, JSON.stringify(unlocked));
        
        showAchievementToast(achievement);
        
        // Chequeo recursivo para "Coleccionista de Oro"
        if (unlocked.length >= 90) desbloquearLogro('secret_gold');

        // Refrescar UI si estamos en la página
        if (document.getElementById('achievementsGrid')) {
            renderAchievements();
        }
    }
}

// --- 4. Sistema de Notificaciones ---

function showAchievementToast(achievement) {
    // Sonido
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Sonido corto genérico
    audio.volume = 0.5;
    audio.play().catch(e => {});

    let toast = document.createElement('div');
    toast.className = 'toast achievement-toast show';
    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <i class="${achievement.icon}" style="color:var(--color-accent); font-size:1.5rem;"></i>
            <div>
                <div style="font-weight:bold; color:var(--color-accent); font-size:0.8rem;">¡NUEVO LOGRO! 🏆</div>
                <div>${achievement.title}</div>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- 5. Renderizado ---

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    const unlocked = getUnlockedAchievements();
    const unlockedIds = unlocked.map(u => u.id);
    
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlockedIds.includes(ach.id);
        const unlockInfo = unlocked.find(u => u.id === ach.id);
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}" id="${ach.id}">
                <div class="achievement-icon"><i class="${ach.icon}"></i></div>
                <div class="achievement-info">
                    <h3>${ach.title}</h3>
                    <p>${ach.desc}</p>
                    ${isUnlocked ? `<small style="color:var(--color-accent); font-weight:bold;">🏆 Conseguido: ${unlockInfo.date}</small>` : '<small><i class="fa-solid fa-lock"></i> Bloqueado</small>'}
                </div>
            </div>
        `;
    }).join('');
}

// --- 6. Inicialización y Trackers ---

document.addEventListener('DOMContentLoaded', () => {
    renderAchievements();
    
    // --- CUSTOM CURSOR LOGIC ---
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let isHoveringModal = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Option A: Detect if hovering over a modal/overlay to disable custom cursor
        isHoveringModal = !!e.target.closest('.modal-overlay, .drawer, .reader-overlay, .reader-lore-overlay');
    }, { passive: true }); // Option B: Passive listener for performance

    function updateCursor() {
        cursor.style.setProperty('--mouse-x', mouseX + 'px');
        cursor.style.setProperty('--mouse-y', mouseY + 'px');
        
        if (isHoveringModal) cursor.classList.add('hidden');
        else cursor.classList.remove('hidden');

        requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);

    // Detectar elementos interactivos para efecto hover
    const interactiveSelectors = 'a, button, .btn, input, textarea, select, label, .card, .story-card, .game-card, .nav-item, .song-row, .key, .bookmark-card, .gallery-card, .story-card-v2, .floating-btn, .close-modal-btn, .hub-card, .filter-btn, .action-btn, .nav a';
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.matches(interactiveSelectors) || e.target.closest(interactiveSelectors)) {
            cursor.classList.add('hover-active');
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.matches(interactiveSelectors) || e.target.closest(interactiveSelectors)) {
            cursor.classList.remove('hover-active');
        }
    });
    // ---------------------------

    desbloquearLogro('web_login');

    // Tracker de Hora (Explorador Nocturno)
    const hour = new Date().getHours();
    if (hour === 3) desbloquearLogro('web_night');

    // Tracker de Año (Beta Tester)
    if (new Date().getFullYear() === 2026) desbloquearLogro('secret_beta');

    // Tracker de Días Consecutivos
    trackDailyLogin();

    // Tracker de Clicks en Index
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        document.addEventListener('click', () => {
            let stats = getStats();
            stats.clicks = (stats.clicks || 0) + 1;
            saveStats(stats);
            if (stats.clicks >= 100) desbloquearLogro('web_clicker_100');
        });

        // Konami Code (Click en Logo)
        const logo = document.querySelector('.logo');
        if(logo) {
            let logoClicks = 0;
            logo.addEventListener('click', () => {
                logoClicks++;
                if(logoClicks >= 10) desbloquearLogro('secret_konami');
            });
        }
    }
});

function trackDailyLogin() {
    let stats = getStats();
    const today = new Date().toDateString();
    
    if (stats.lastLogin !== today) {
        // Verificar si es el día siguiente
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (stats.lastLogin === yesterday.toDateString()) {
            stats.consecutiveDays++;
        } else {
            stats.consecutiveDays = 1;
        }
        
        stats.lastLogin = today;
        saveStats(stats);
        
        if (stats.consecutiveDays >= 5) desbloquearLogro('web_loyal_5');
    }
}

// Función para el logro Hacker
window.unlockHacker = function() {
    desbloquearLogro('secret_hacker');
};