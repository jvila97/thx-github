/**
 * Series Manager - Core Logic
 * Gestión de series, cálculo de horas y navegación.
 */

const STORAGE_KEY = 'my_series_data_v1';

// Imagen por defecto (SVG en Base64) para cuando falla la carga local
const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='dimgray'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='darkgray' font-family='sans-serif' font-size='24'%3ENO IMAGE%3C/text%3E%3C/svg%3E";

let seriesData = [];

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // Solo ejecutar lógica de series si estamos en la página de series
    if (document.getElementById('seriesGrid')) {
        loadData();
        setupEventListeners();
        app.render();

        // Check for URL params to open details from global search
        const urlParams = new URLSearchParams(window.location.search);
        const seriesIdToOpen = urlParams.get('seriesId');
        if (seriesIdToOpen) {
            setTimeout(() => app.openDetails(parseInt(seriesIdToOpen)), 300);
        }

        // Listener para búsqueda en Jikan (Debounce de 400ms + Autocomplete)
        const jikanInput = document.getElementById('jikanSearchInput');
        let jikanTimeout;
        if (jikanInput) {
            // Autocompletado mientras escribes
            jikanInput.addEventListener('input', (e) => {
                clearTimeout(jikanTimeout);
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    jikanTimeout = setTimeout(() => buscarAnimeJikan(query), 400);
                }
            });

            // Búsqueda al presionar Enter
            jikanInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(jikanTimeout);
                    buscarAnimeJikan(jikanInput.value.trim());
                }
            });

            // Búsqueda al hacer clic en el botón
            const jikanBtn = document.getElementById('jikanSearchBtn');
            if (jikanBtn) {
                jikanBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    clearTimeout(jikanTimeout);
                    buscarAnimeJikan(jikanInput.value.trim());
                });
            }
        }
    }
});

// --- FUNCIONES DE BÚSQUEDA JIKAN (IMPLEMENTACIÓN SOLICITADA) ---

async function buscarAnimeJikan(query) {
  if (!query) return;
  const loading = document.getElementById('jikanLoading');
  const errorDiv = document.getElementById('jikanError');
  
  if (loading) loading.style.display = 'block';
  if (errorDiv) errorDiv.style.display = 'none';

  try {
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=8&sfw`);
    const json = await response.json();
    const resultados = json.data;
    
    if (loading) loading.style.display = 'none';

    if (!resultados || resultados.length === 0) {
      mostrarMensaje('No se encontraron resultados para ese anime');
      return;
    }
    renderizarResultados(resultados);
  } catch (error) {
    if (loading) loading.style.display = 'none';
    mostrarMensaje('No se puede conectar con Jikan API en este momento');
    console.error(error);
  }
}

function renderizarResultados(resultados) {
  const contenedor = document.getElementById('jikan-results');
  if (!contenedor) return;
  contenedor.innerHTML = '';
  resultados.forEach(anime => {
    // Fallback de título y truncado a 40 caracteres
    const displayTitle = anime.title || anime.title_english || 'Sin título';
    const truncatedTitle = displayTitle.length > 40 ? displayTitle.substring(0, 37) + '...' : displayTitle;

    const card = document.createElement('div');
    card.className = 'jikan-item';
    // Estilo mejorado para evitar solapamientos
    card.innerHTML = `
      <img src="${anime.images.jpg.image_url}" alt="${displayTitle}" class="jikan-poster">
      <div style="display: flex; flex-direction: column; overflow: hidden; text-align: left; width: 100%;">
        <strong class="jikan-item-title" title="${displayTitle}">${truncatedTitle}</strong>
        <span class="jikan-item-year">${anime.aired?.prop?.from?.year ?? 'N/A'} · ${anime.episodes ?? '?'} eps</span>
      </div>
    `;
    card.addEventListener('click', () => seleccionarAnime(anime));
    contenedor.appendChild(card);
  });
}

function seleccionarAnime(anime) {
  // Limpiar y cerrar panel de resultados
  const contenedor = document.getElementById('jikan-results');
  if (contenedor) {
    contenedor.innerHTML = '';
    contenedor.classList.remove('show');
  }

  // Auto-llenado del formulario con IDs reales de series.html
  document.getElementById('titleInput').value = anime.title || anime.title_english || '';
  document.getElementById('fileNameInput').value = anime.images.jpg.large_image_url || anime.images.jpg.image_url || '';
  document.getElementById('capsInput').value = anime.episodes || '';
  
  // Limpieza de duración (extraer solo el número)
  const durationStr = anime.duration ? anime.duration.match(/\d+/) : null;
  document.getElementById('durationInput').value = durationStr ? durationStr[0] : 24;
  
  document.getElementById('yearInput').value = anime.aired?.prop?.from?.year || '';
  
  // La puntuación de MAL es 0-10, igual que el input del sitio
  document.getElementById('ratingInput').value = anime.score ? Math.round(anime.score) : '';
  document.getElementById('ratingInput').value = anime.score ? Math.round(anime.score) : '';
  document.getElementById('ratingInput').value = anime.score || '';
  document.getElementById('statusInput').value = 'pendiente';
  document.getElementById('synopsisInput').value = anime.synopsis || '';

  // Cambiar a la vista del formulario
  app.navigate('add');

  // Scroll suave hacia el formulario para feedback visual
  const formView = document.getElementById('view-add');
  if (formView) {
      formView.scrollIntoView({ behavior: 'smooth' });
  }

  app.showToast('Información de anime cargada.');
}

function mostrarMensaje(msg) {
    const errorMsg = document.getElementById('jikanError');
    if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
    }
    app.showToast(msg);
}

// --- Persistencia ---
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seriesData));
    app.render();
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        seriesData = JSON.parse(stored);
        // Data migration for image paths from old 'img/' structure
        let needsSave = false;
        seriesData.forEach(serie => {
            if (serie.cover && serie.cover.startsWith('img/')) {
                serie.cover = `../assets/${serie.cover}`; // e.g., 'img/portadas/file.jpg' -> '../assets/img/portadas/file.jpg'
                needsSave = true;
            }
        });
        if (needsSave) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seriesData));
        }
    }
}

// --- Lógica de Negocio ---

const app = {
    currentSeriesId: null,
    quickEditingId: null, // Track which card is in quick edit mode
    jikanPreviewData: null, // Almacena temporalmente los metadatos del anime seleccionado
    // Variable temporal para almacenar datos antes de confirmar importación
    pendingImport: null,

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
        const isAiring = app.jikanPreviewData ? app.jikanPreviewData.airing : false;

        if (!title || !caps || !duration) {
            return alert('Por favor, completa todos los campos.');
        }

        // Lógica de selección de imagen
        // 1. Si hay nombre manual, usa ese (asumiendo que está en img/portadas/)
        // 2. Si no, genera nombre automático basado en el título
        const imageName = manualFile ? manualFile : app.formatFileName(title);
        
        let coverPath;
        if (imageName.startsWith('http') || imageName.startsWith('data:')) {
            coverPath = imageName;
        } else {
            coverPath = `../assets/img/portadas/${imageName}`;
        }

        // Calcular horas totales
        const totalHours = ((caps * duration) / 60).toFixed(1);

        const newSeries = {
            id: Date.now(),
            title, caps, duration, totalHours,
            cover: coverPath,
            synopsis: synopsis || "Sin descripción disponible.",
            releaseYear: releaseYear || "????",
            rating: rating || "-",
            status: status, // Guardamos el estado seleccionado
            isAiring: isAiring
        };

        seriesData.push(newSeries);
        saveData();

        // Limpieza de estados de búsqueda
        app.jikanPreviewData = null;
        if (document.getElementById('jikanPreviewContainer')) document.getElementById('jikanPreviewContainer').innerHTML = '';

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

    toggleQuickEdit: (id, btn) => {
        const card = btn.closest('.series-card');
        const isEditing = card.classList.contains('quick-edit-mode');

        // If another card is being edited, cancel it first
        if (app.quickEditingId && app.quickEditingId !== id) {
            const otherCard = document.querySelector(`.series-card.quick-edit-mode`);
            if (otherCard) app.cancelQuickEdit(app.quickEditingId, otherCard);
        }

        if (isEditing) {
            app.cancelQuickEdit(id, card);
        } else {
            app.quickEditingId = id;
            const serie = seriesData.find(s => s.id === id);
            if (!serie) return;

            card.classList.add('quick-edit-mode');
            const overlay = card.querySelector('.quick-edit-overlay');

            overlay.innerHTML = `
                <label style="font-size: 0.8rem; color: var(--text-muted);">Estado</label>
                <select id="quick-edit-status-${id}" class="quick-edit-input">
                    <option value="pendiente" ${serie.status === 'pendiente' ? 'selected' : ''}>📋 Pendiente</option>
                    <option value="viendo" ${serie.status === 'viendo' ? 'selected' : ''}>👀 Viendo</option>
                    <option value="simulcast" ${serie.status === 'simulcast' ? 'selected' : ''}>📡 Simulcast</option>
                    <option value="visto" ${serie.status === 'visto' ? 'selected' : ''}>✅ Visto</option>
                    <option value="abandonado" ${serie.status === 'abandonado' ? 'selected' : ''}>❌ Abandonado</option>
                </select>
                <label style="font-size: 0.8rem; color: var(--text-muted);">Capítulos</label>
                <input type="number" id="quick-edit-caps-${id}" class="quick-edit-input" value="${serie.caps}" min="1">
                <div class="quick-edit-actions">
                    <button class="quick-edit-btn quick-edit-cancel" onclick="event.stopPropagation(); app.cancelQuickEdit(${id})"><i class="fa-solid fa-xmark"></i></button>
                    <button class="quick-edit-btn quick-edit-confirm" onclick="event.stopPropagation(); app.saveQuickEdit(${id})"><i class="fa-solid fa-check"></i></button>
                </div>
            `;

            // Add keyboard listeners
            overlay.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    app.saveQuickEdit(id);
                } else if (e.key === 'Escape') {
                    app.cancelQuickEdit(id);
                }
            });
            
            overlay.querySelector('select').focus();
        }
    },

    saveQuickEdit: (id) => {
        const card = document.querySelector(`.series-card.quick-edit-mode`);
        if (!card) return;

        const newStatus = card.querySelector(`#quick-edit-status-${id}`).value;
        const newCaps = parseInt(card.querySelector(`#quick-edit-caps-${id}`).value);

        const index = seriesData.findIndex(s => s.id === id);
        if (index !== -1) {
            seriesData[index].status = newStatus;
            seriesData[index].caps = newCaps;
            seriesData[index].totalHours = ((newCaps * seriesData[index].duration) / 60).toFixed(1);
            saveData();
            app.showToast('Cambios guardados');
        }
        app.quickEditingId = null;
    },

    cancelQuickEdit: (id, cardElement) => {
        const card = cardElement || document.querySelector(`.series-card.quick-edit-mode`);
        if (card) {
            card.classList.remove('quick-edit-mode');
            const overlay = card.querySelector('.quick-edit-overlay');
            overlay.innerHTML = ''; // Clean up
        }
        app.quickEditingId = null;
    },

    // --- Sistema de Importación / Exportación ---

    exportData: () => {
        const dataStr = JSON.stringify(seriesData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().split('T')[0];
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `sanchezcabron_anime_backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        app.showToast('Backup exportado correctamente');
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
                const json = JSON.parse(e.target.result);
                
                // Validación básica de estructura
                if (!Array.isArray(json)) throw new Error("El archivo no contiene una lista válida (debe ser un array).");
                if (json.length > 0 && (!json[0].hasOwnProperty('title') || !json[0].hasOwnProperty('id'))) {
                    throw new Error("El archivo no parece ser un backup de series válido (faltan campos críticos).");
                }

                app.pendingImport = json;
                
                // Configurar y mostrar Modal de Previsualización
                const modal = document.getElementById('importModal');
                const msg = document.getElementById('importMsg');
                const preview = document.getElementById('importPreview');

                msg.textContent = `Se han encontrado ${json.length} entradas en el archivo. ¿Cómo deseas proceder?`;
                
                // Generar vista previa de los primeros elementos
                const sample = json.slice(0, 5).map(s => `• ${s.title} (${s.releaseYear || '?'})`).join('<br>');
                preview.innerHTML = `<strong>Vista previa:</strong><br>${sample}${json.length > 5 ? '<br>...y más' : ''}`;

                modal.style.display = 'flex';

            } catch (err) {
                console.error(err);
                alert(`❌ Error de Importación:\n${err.message}`);
                app.showToast('Error: Archivo inválido');
            }
            // Resetear input para permitir importar el mismo archivo si se corrigió
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    closeImportModal: () => {
        document.getElementById('importModal').style.display = 'none';
        app.pendingImport = null;
    },

    confirmImport: (mode) => {
        if (!app.pendingImport) return;

        if (mode === 'replace') {
            seriesData = app.pendingImport;
            saveData();
            app.showToast(`${seriesData.length} series importadas (Lista reemplazada)`);
        } else if (mode === 'merge') {
            let addedCount = 0;
            app.pendingImport.forEach(newItem => {
                // Evitar duplicados por ID exacto y Título
                const existsId = seriesData.some(s => s.id === newItem.id);
                const existsTitle = seriesData.some(s => s.title.toLowerCase() === newItem.title.toLowerCase());
                
                if (!existsId && !existsTitle) {
                    seriesData.push(newItem);
                    addedCount++;
                }
            });
            saveData();
            app.showToast(`${addedCount} entradas nuevas combinadas`);
        }
        app.closeImportModal();
    },

    renderJikanResultsList: (resultados) => {
        const resultsContainer = document.getElementById('jikanResults');
        const errorMsg = document.getElementById('jikanError');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = resultados.map(item => `
            <div class="jikan-item" onclick="app.selectJikanItem(${item.mal_id})">
                <img src="${item.images.jpg.image_url}" class="jikan-poster" onerror="this.src='${FALLBACK_IMG}'">
                <div style="display:flex; flex-direction:column; overflow:hidden;">
                    <span class="jikan-item-title">${item.title}</span>
                    <span class="jikan-item-year">${item.year || 'N/A'} • ${item.episodes || '?'} caps</span>
                </div>
            </div>
        `).join('');
        resultsContainer.classList.add('show');
        if (errorMsg) errorMsg.style.display = 'none';
    },

    selectJikanItem: async (malId) => {
        const resultsContainer = document.getElementById('jikanResults');
        resultsContainer.classList.remove('show');
        
        const loading = document.getElementById('jikanLoading');
        if (loading) loading.style.display = 'block';

        try {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${malId}/full`);
            
            if (response.status === 429) {
                app.showToast('Demasiadas búsquedas, espera un momento...');
                setTimeout(() => app.selectJikanItem(malId), 1000);
                return;
            }

            const result = await response.json();
            const data = result.data;
            if (loading) loading.style.display = 'none';

            if (data) {
                app.jikanPreviewData = data;

                // Mapeo automático de campos
                document.getElementById('titleInput').value = data.title;
                document.getElementById('yearInput').value = data.year || (data.aired.from ? data.aired.from.split('-')[0] : '');
                document.getElementById('ratingInput').value = data.score || '';
                
                // Normalizar duración (ej: "24 min per ep" -> 24)
                const durationMatch = data.duration.match(/\d+/);
                document.getElementById('durationInput').value = durationMatch ? durationMatch[0] : 24;
                
                document.getElementById('capsInput').value = data.episodes || 0;
                document.getElementById('fileNameInput').value = data.images.jpg.large_image_url;
                document.getElementById('statusInput').value = 'pendiente';

                // Construcción de sinopsis técnica enriquecida
                const genres = data.genres.map(g => g.name).join(', ');
                const studios = data.studios.map(s => s.name).join(', ');
                const season = data.season ? `${data.season.toUpperCase()} ` : '';
                
                let techInfo = `[${data.title_japanese || ''}]\n`;
                techInfo += `Estudio: ${studios || 'Desconocido'} | Géneros: ${genres || 'N/A'}\n`;
                techInfo += `Temporada: ${season}${data.year || ''}\n\n`;
                techInfo += data.synopsis || "Sin descripción disponible.";
                
                document.getElementById('synopsisInput').value = techInfo;

                // Renderizar Tarjeta de Previsualización
                app.renderJikanPreview(data);
                app.navigate('add');
                app.showToast('Datos de Jikan importados. Revisa la previsualización.');
            }
        } catch (err) {
            if (loading) loading.style.display = 'none';
            app.showToast('Error de conexión al obtener detalles.');
        }
    },

    renderJikanPreview: (data) => {
        const form = document.getElementById('addSeriesForm');
        let container = document.getElementById('jikanPreviewContainer');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'jikanPreviewContainer';
            container.style.cssText = 'background: rgba(0,0,0,0.2); padding: 15px; border-radius: 4px; margin-bottom: 20px; border: 1px dashed var(--color-accent);';
            form.prepend(container);
        }

        const airingBadge = data.airing ? `<span class="badge-airing">En emisión</span>` : '';

        container.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: start;">
                <img src="${data.images.jpg.image_url}" style="width: 100px; height: 140px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #fff;">${data.title} ${airingBadge}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px;">MAL Score: <strong>${data.score || 'N/A'}</strong> | ${data.episodes || '?'} eps</p>
                    <p style="font-size: 0.75rem; color: #ccc; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${data.synopsis || ''}</p>
                </div>
            </div>
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--primary-color); text-align: center;">
                <i class="fa-solid fa-circle-check"></i> Revisa los campos y pulsa "Guardar Serie" para añadir a tu lista.
            </div>
        `;
    },

    render: () => {
        const grid = document.getElementById('seriesGrid');
        const counter = document.getElementById('total-counter');
        const hoursCounter = document.getElementById('total-hours');
        const statusCounters = document.getElementById('statusCounters');
        
        counter.textContent = `${seriesData.length} series`;
        grid.innerHTML = '';

        // Calcular horas totales dinámicamente
        const totalHoursSum = seriesData.reduce((sum, serie) => sum + parseFloat(serie.totalHours), 0);
        if (hoursCounter) hoursCounter.textContent = `${totalHoursSum.toFixed(1)}h Estimadas`;

        // Calcular contadores
        const stats = { pendiente: 0, visto: 0, viendo: 0, simulcast: 0, abandonado: 0 };
        seriesData.forEach(s => {
            if (stats[s.status] !== undefined) stats[s.status]++;
            else stats.pendiente++; // Fallback for older entries without a status
        });

        statusCounters.innerHTML = `
            <span class="status-pill bg-pendiente"><i class="fa-solid fa-list-check"></i> Pendiente: ${stats.pendiente}</span>
            <span class="status-pill bg-visto"><i class="fa-solid fa-check"></i> Visto: ${stats.visto}</span>
            <span class="status-pill bg-viendo"><i class="fa-solid fa-eye"></i> Viendo: ${stats.viendo}</span>
            <span class="status-pill bg-simulcast"><i class="fa-solid fa-satellite-dish"></i> Simulcast: ${stats.simulcast}</span>
            <span class="status-pill bg-abandonado"><i class="fa-solid fa-xmark"></i> Drop: ${stats.abandonado}</span>
        `;

        [...seriesData].reverse().forEach(serie => {
            const card = document.createElement('div');
            card.className = 'series-card';
            
            const airingBadge = serie.isAiring ? `<span class="badge-airing">En emisión</span>` : '';
            
            card.innerHTML = `
                <div class="quick-edit-overlay"></div>
                <div class="card-actions">
                    <button class="action-btn quick-edit-trigger" onclick="event.stopPropagation(); app.toggleQuickEdit(${serie.id}, this)" title="Edición Rápida"><i class="fa-solid fa-bolt"></i></button>
                    <button class="action-btn edit-btn" onclick="event.stopPropagation(); app.openDetails(${serie.id}, true)" title="Editar Completo"><i class="fa-solid fa-pencil"></i></button>
                    <button class="action-btn delete-btn" onclick="event.stopPropagation(); app.deleteSeries(${serie.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div>
                <img src="${serie.cover}" 
                     alt="${serie.title}" 
                     class="card-image"
                     onerror="this.onerror=null; this.src='${FALLBACK_IMG}';"
                     onclick="app.openDetails(${serie.id})" style="cursor:pointer;"
                >
                <div class="card-content" onclick="app.openDetails(${serie.id})" style="cursor:pointer;">
                    <div class="card-title">${serie.title} ${airingBadge}</div>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-layer-group"></i> ${serie.caps} caps</span>
                        <span><i class="fa-solid fa-stopwatch"></i> ${serie.duration} min</span>
                    </div>
                    <span class="card-hours"><i class="fa-solid fa-clock"></i> ${serie.totalHours} Horas totales</span>
                    
                    <!-- Selector de Estado Rápido -->
                    <select onclick="event.stopPropagation()" onchange="app.updateStatus(${serie.id}, this.value)" class="status-select bg-${serie.status}">
                        <option value="pendiente" ${serie.status === 'pendiente' ? 'selected' : ''}>📋 Pendiente</option>
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