/**
 * Series Manager - Core Logic
 * Gestión de series, cálculo de horas y navegación.
 */

const STORAGE_KEY = 'my_series_data_v1';

// Imagen por defecto (SVG en Base64) para cuando falla la carga local
const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%232a2a2a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-family='sans-serif' font-size='24'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

let seriesData = [];

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Solo ejecutar lógica de series si estamos en la página de series
    if (document.getElementById('seriesGrid')) {
        loadData();
        setupEventListeners();
        app.render();
    }
});

// --- Persistencia ---
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seriesData));
    app.render();
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        seriesData = JSON.parse(stored);
    }
}

// --- Lógica de Negocio ---

const app = {
    currentSeriesId: null,
    // Navegación entre vistas
    navigate: (viewId) => {
        // Ocultar todas las vistas (dentro del módulo actual)
        document.querySelectorAll('.view-container').forEach(el => el.style.display = 'none');
        // Mostrar la seleccionada
        document.getElementById(`view-${viewId}`).style.display = 'block';
        
        if (viewId === 'list') {
            app.render();
        }
    },

    // Utilidad para formatear nombres de archivo: "Fairy Tail" -> "fairytail.jpg"
    formatFileName: (title) => {
        return title.toLowerCase().replace(/[^a-z0-9]/g, '') + '.jpg';
    },

    addSeries: (e) => {
        e.preventDefault();
        
        const title = document.getElementById('titleInput').value.trim();
        const caps = parseInt(document.getElementById('capsInput').value);
        const duration = parseInt(document.getElementById('durationInput').value);
        const manualFile = document.getElementById('fileNameInput').value.trim();
        const synopsis = document.getElementById('synopsisInput').value.trim();
        const releaseYear = document.getElementById('yearInput').value;
        const rating = document.getElementById('ratingInput').value;
        const status = document.getElementById('statusInput').value;

        if (!title || !caps || !duration) {
            return alert('Por favor, completa todos los campos.');
        }

        // Lógica de selección de imagen
        // 1. Si hay nombre manual, usa ese (asumiendo que está en img/portadas/)
        // 2. Si no, genera nombre automático basado en el título
        const imageName = manualFile ? manualFile : app.formatFileName(title);
        const coverPath = `img/portadas/${imageName}`;

        // Calcular horas totales
        const totalHours = ((caps * duration) / 60).toFixed(1);

        const newSeries = {
            id: Date.now(),
            title, caps, duration, totalHours,
            cover: coverPath,
            synopsis: synopsis || "Sin descripción disponible.",
            releaseYear: releaseYear || "????",
            rating: rating || "-",
            status: status // Guardamos el estado seleccionado
        };

        seriesData.push(newSeries);
        saveData();

        // --- LOGROS ---
        if (typeof desbloquearLogro === 'function') {
            desbloquearLogro('series_1'); // Logro: Primera serie
            if (seriesData.length >= 10) desbloquearLogro('series_10');
            if (parseFloat(rating) === 10) desbloquearLogro('series_critic');
        }
        
        document.getElementById('addSeriesForm').reset();
        app.navigate('list');
    },

    deleteSeries: (id) => {
        if(confirm('¿Seguro que quieres borrar esta serie?')) {
            seriesData = seriesData.filter(item => item.id !== id);
            saveData();
        }
    },

    updateStatus: (id, newStatus) => {
        const serie = seriesData.find(item => item.id === id);
        if (serie) {
            serie.status = newStatus;
            saveData(); // Esto volverá a renderizar la vista automáticamente
        }
    },

    openDetails: (id, editMode = false) => {
        app.currentSeriesId = id;
        const serie = seriesData.find(s => s.id === id);
        if (!serie) return;

        document.getElementById('modalTitle').textContent = serie.title;
        document.getElementById('modalCover').src = serie.cover;
        document.getElementById('modalYear').textContent = serie.releaseYear || "????";
        document.getElementById('modalRating').textContent = serie.rating || "-";
        document.getElementById('modalSynopsis').textContent = serie.synopsis || "Sin descripción disponible.";

        // Resetear botón de edición
        const editBtn = document.getElementById('editBtn');
        if(editBtn) editBtn.innerHTML = '<i class="fa-solid fa-pencil"></i>';

        // Mostrar modal y bloquear scroll
        document.getElementById('detailsModal').style.display = 'flex';
        document.body.classList.add('no-scroll');

        if (editMode) {
            app.toggleEditMode();
        }
    },

    closeDetails: (e) => {
        // Si se pasa evento (click en overlay), verificar que sea el overlay
        if (e && e.target !== e.currentTarget) return;

        document.getElementById('detailsModal').style.display = 'none';
        document.body.classList.remove('no-scroll');
        
        // Limpiar wrapper de edición de imagen si existe al cerrar
        const editWrapper = document.getElementById('coverEditWrapper');
        if(editWrapper) editWrapper.remove();
        // Asegurar que la imagen vuelve a ser visible si estaba oculta o movida
        document.getElementById('modalCover').style.display = 'block';
    },

    toggleEditMode: () => {
        const editBtn = document.getElementById('editBtn');
        const isEditing = editBtn.querySelector('.fa-floppy-disk');

        if (isEditing) {
            app.saveEditMode();
        } else {
            const serie = seriesData.find(s => s.id === app.currentSeriesId);
            if (!serie) return;

            const yearVal = serie.releaseYear === '????' ? '' : serie.releaseYear;
            const ratingVal = serie.rating === '-' ? '' : serie.rating;

            // Inyectar input para Imagen
            const modalCover = document.getElementById('modalCover');
            const editWrapper = document.createElement('div');
            editWrapper.id = 'coverEditWrapper';
            editWrapper.innerHTML = `
                <input type="text" class="modal-input" id="editCover" value="${serie.cover}" placeholder="URL de imagen o ruta local">
                <label class="file-custom-btn" style="margin:0; font-size:0.8rem;">
                    <i class="fa-solid fa-upload"></i> Subir nueva imagen
                    <input type="file" id="editCoverFile" accept="image/*" onchange="app.previewEditImage(this)" style="display:none;">
                </label>
            `;
            modalCover.parentNode.insertBefore(editWrapper, modalCover);

            document.getElementById('modalTitle').innerHTML = `<input type="text" class="modal-input" id="editTitle" value="${serie.title}">`;
            document.getElementById('modalYear').innerHTML = `<input type="number" class="modal-input" id="editYear" value="${yearVal}" style="width: 80px;" placeholder="Año">`;
            document.getElementById('modalRating').innerHTML = `<input type="number" class="modal-input" id="editRating" value="${ratingVal}" step="0.1" min="0" max="10" style="width: 70px;" placeholder="0-10">`;
            document.getElementById('modalSynopsis').innerHTML = `<textarea class="modal-input" id="editSynopsis" rows="5">${serie.synopsis}</textarea>`;

            editBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        }
    },

    saveEditMode: () => {
        const cover = document.getElementById('editCover').value;
        const title = document.getElementById('editTitle').value;
        const year = document.getElementById('editYear').value;
        const rating = document.getElementById('editRating').value;
        const synopsis = document.getElementById('editSynopsis').value;

        const index = seriesData.findIndex(s => s.id === app.currentSeriesId);
        if (index !== -1) {
            seriesData[index].cover = cover || seriesData[index].cover;
            seriesData[index].title = title || seriesData[index].title;
            seriesData[index].releaseYear = year || "????";
            seriesData[index].rating = rating || "-";
            seriesData[index].synopsis = synopsis || "Sin descripción disponible.";
            
            saveData(); // Guarda y renderiza la lista principal

            // Limpiar inputs de imagen
            const editWrapper = document.getElementById('coverEditWrapper');
            if(editWrapper) editWrapper.remove();

            // Restaurar vista de lectura
            document.getElementById('modalCover').src = seriesData[index].cover;
            document.getElementById('modalTitle').textContent = seriesData[index].title;
            document.getElementById('modalYear').textContent = seriesData[index].releaseYear;
            document.getElementById('modalRating').textContent = seriesData[index].rating;
            document.getElementById('modalSynopsis').textContent = seriesData[index].synopsis;

            document.getElementById('editBtn').innerHTML = '<i class="fa-solid fa-pencil"></i>';
            app.showToast('Información actualizada con éxito');
        }
    },

    previewEditImage: (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('modalCover').src = e.target.result;
                document.getElementById('editCover').value = e.target.result;
            }
            reader.readAsDataURL(input.files[0]);
        }
    },

    showToast: (msg) => {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    render: () => {
        const grid = document.getElementById('seriesGrid');
        const counter = document.getElementById('total-counter');
        const statusCounters = document.getElementById('statusCounters');
        
        counter.textContent = `${seriesData.length} series`;
        grid.innerHTML = '';

        // Calcular contadores
        const stats = { visto: 0, viendo: 0, simulcast: 0, abandonado: 0 };
        seriesData.forEach(s => {
            if (stats[s.status] !== undefined) stats[s.status]++;
            else stats.viendo++; // Fallback por si acaso
        });

        statusCounters.innerHTML = `
            <span class="status-pill bg-visto"><i class="fa-solid fa-check"></i> Visto: ${stats.visto}</span>
            <span class="status-pill bg-viendo"><i class="fa-solid fa-eye"></i> Viendo: ${stats.viendo}</span>
            <span class="status-pill bg-simulcast"><i class="fa-solid fa-satellite-dish"></i> Simulcast: ${stats.simulcast}</span>
            <span class="status-pill bg-abandonado"><i class="fa-solid fa-xmark"></i> Drop: ${stats.abandonado}</span>
        `;

        seriesData.forEach(serie => {
            const card = document.createElement('div');
            card.className = 'series-card';
            // Hacemos toda la tarjeta clickable para abrir detalles
            card.onclick = () => app.openDetails(serie.id);
            card.style.cursor = 'pointer';
            
            card.innerHTML = `
                <div class="card-actions">
                    <button class="action-btn edit-btn" onclick="event.stopPropagation(); app.openDetails(${serie.id}, true)"><i class="fa-solid fa-pencil"></i></button>
                    <button class="action-btn delete-btn" onclick="event.stopPropagation(); app.deleteSeries(${serie.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <img src="${serie.cover}" 
                     alt="${serie.title}" 
                     class="card-image"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMG}';"
                >
                <div class="card-content">
                    <div class="card-title">${serie.title}</div>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-layer-group"></i> ${serie.caps} caps</span>
                        <span><i class="fa-solid fa-stopwatch"></i> ${serie.duration} min</span>
                    </div>
                    <span class="card-hours"><i class="fa-solid fa-clock"></i> ${serie.totalHours} Horas totales</span>
                    
                    <!-- Selector de Estado Rápido -->
                    <select onclick="event.stopPropagation()" onchange="app.updateStatus(${serie.id}, this.value)" class="status-select bg-${serie.status}">
                        <option value="viendo" ${serie.status === 'viendo' ? 'selected' : ''}>👀 Viendo</option>
                        <option value="simulcast" ${serie.status === 'simulcast' ? 'selected' : ''}>📡 Simulcast</option>
                        <option value="visto" ${serie.status === 'visto' ? 'selected' : ''}>✅ Visto</option>
                        <option value="abandonado" ${serie.status === 'abandonado' ? 'selected' : ''}>❌ Abandonado</option>
                    </select>
                </div>
            `;
            grid.appendChild(card);
        });
    }
};

function setupEventListeners() {
    document.getElementById('addSeriesForm').addEventListener('submit', app.addSeries);
}