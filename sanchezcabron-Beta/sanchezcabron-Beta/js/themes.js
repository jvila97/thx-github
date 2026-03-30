const THEMES = [
    'theme-midnight', 'theme-blood', 'theme-matrix', 'theme-gold', 'theme-arctic',
    'theme-persona3', 'theme-persona4', 'theme-persona5', 'theme-cyberpunk', 'theme-darksouls', 'theme-xbox'
];
const PICKER_MAP = {
    'picker-bg-primary': '--color-bg-primary',
    'picker-bg-secondary': '--color-bg-secondary',
    'picker-accent': '--color-accent',
    'picker-accent-hover': '--color-accent-hover',
    'picker-text-primary': '--color-text-primary',
    'picker-text-secondary': '--color-text-secondary',
    'picker-border': '--color-border',
    'picker-success': '--color-success',
    'picker-danger': '--color-danger'
};

function aplicarTema(tema) {
    // Limpiar clases de temas predefinidos
    THEMES.forEach(t => document.body.classList.remove(t));
    
    // IMPORTANTE: Limpiar estilos inline del editor custom para evitar conflictos (Test 7)
    Object.values(PICKER_MAP).forEach(v => document.documentElement.style.removeProperty(v));

    if (tema !== 'default' && tema !== 'custom') {
        document.body.classList.add(tema);
    }
    
    if (tema === 'custom') {
        cargarTemaPersonalizado();
    }

    localStorage.setItem('sanchezcabron-tema', tema);
    actualizarSwatchesUI(tema);
}

function cargarTemaGuardado() {
    const temaGuardado = localStorage.getItem('sanchezcabron-tema');
    if (temaGuardado === 'custom') {
        cargarTemaPersonalizado();
    } else if (temaGuardado) {
        aplicarTema(temaGuardado);
    }
}

function actualizarSwatchesUI(temaActivo) {
    document.querySelectorAll('.theme-swatch').forEach(s => {
        const preview = s.querySelector('div');
        if (!preview) return;
        
        const isMatch = s.dataset.tema === temaActivo;
        s.classList.toggle('active', isMatch);
        
        // Aplicamos estilos dinámicos para el Test 1 (Borde brillante)
        if (isMatch) {
            preview.style.border = '3px solid #66c0f4';
            preview.style.boxShadow = '0 0 15px rgba(102, 192, 244, 0.6)';
            if (s.querySelector('span')) s.querySelector('span').style.color = '#fff';
        } else {
            preview.style.border = '2px solid #333';
            preview.style.boxShadow = 'none';
            if (s.querySelector('span')) s.querySelector('span').style.color = 'var(--color-text-secondary)';
        }
    });
};

function inicializarPickers() {
  Object.entries(PICKER_MAP).forEach(([pickerId, variable]) => {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    const currentValue = getComputedStyle(document.documentElement)
      .getPropertyValue(variable).trim();
    picker.value = currentValue;
    picker.addEventListener('input', () => {
      document.documentElement.style.setProperty(variable, picker.value);
      actualizarPreview(pickerId, picker.value);
    });
  });
}

function actualizarPreview(pickerId, color) {
  const preview = document.querySelector(`[data-preview='${pickerId}']`);
  if (preview) preview.style.backgroundColor = color;
}

function guardarTemaPersonalizado() {
  const temaCustom = {};
  Object.entries(PICKER_MAP).forEach(([pickerId, variable]) => {
    const picker = document.getElementById(pickerId);
    if (picker) temaCustom[variable] = picker.value;
  });
  localStorage.setItem('sanchezcabron-tema-custom', JSON.stringify(temaCustom));
  localStorage.setItem('sanchezcabron-tema', 'custom');
}

function cargarTemaPersonalizado() {
  const temaCustom = localStorage.getItem('sanchezcabron-tema-custom');
  if (!temaCustom) return;
  const colores = JSON.parse(temaCustom);
  Object.entries(colores).forEach(([variable, valor]) => {
    document.documentElement.style.setProperty(variable, valor);
  });
}

document.addEventListener('DOMContentLoaded', () => {
    cargarTemaGuardado();
    inicializarPickers();

    document.querySelectorAll('.theme-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => aplicarTema(swatch.dataset.tema));
    });

    const btnReset = document.getElementById('btn-reset-tema');
    if (btnReset) btnReset.addEventListener('click', () => aplicarTema('default'));

    const btnGuardar = document.getElementById('btn-guardar-tema-custom');
    if (btnGuardar) btnGuardar.addEventListener('click', guardarTemaPersonalizado);

    const btnAplicar = document.getElementById('btn-aplicar-tema-custom');
    if (btnAplicar) btnAplicar.addEventListener('click', cargarTemaPersonalizado);
});