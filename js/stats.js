console.log("🚀 stats.js cargado correctamente");

import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

async function loadSummary() {
  try {
    console.log("Cargando datos de la sesión...");
    const q = query(collection(db, 'sesiones'), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      showNoDataMessage();
      if (window.renderSessionCharts) window.renderSessionCharts({});
      return;
    }
    const data = snapshot.docs[0].data();
    // Mostrar resultados en el tab de resultados
    const summary = document.getElementById('summary');
    const elapsedTime = formatElapsedTime(data.elapsedTime || 0);
    summary.innerHTML = `
      <div class="summary-block">
        <h2>⏱ Tiempo transcurrido</h2>
        <div class="value">${elapsedTime}</div>
      </div>
      <div class="summary-block">
        <h2>🛣 Distancia</h2>
        <div class="value">${data.distance ? data.distance.toFixed(2) : '--'} km</div>
      </div>
      <div class="summary-block">
        <h2>❤️ Frecuencia Cardíaca</h2>
        <div class="stat-main-value">${data.bpm?.avg || '--'} <span class="stat-unit">bpm</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${data.bpm?.min || '--'}</b></span>
          <span class="stat-max">max: <b>${data.bpm?.max || '--'}</b></span>
        </div>
      </div>
      <div class="summary-block">
        <h2>⚡ Potencia</h2>
        <div class="stat-main-value">${data.power?.avg || '--'} <span class="stat-unit">W</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${data.power?.min || '--'}</b></span>
          <span class="stat-max">max: <b>${data.power?.max || '--'}</b></span>
        </div>
      </div>
      <div class="summary-block">
        <h2>🔄 Cadencia</h2>
        <div class="stat-main-value">${data.rpm?.avg || '--'} <span class="stat-unit">rpm</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${data.rpm?.min || '--'}</b></span>
          <span class="stat-max">max: <b>${data.rpm?.max || '--'}</b></span>
        </div>
      </div>
      <div class="summary-block">
        <h2>🚴 Velocidad</h2>
        <div class="stat-main-value">${data.speed?.avg || '--'} <span class="stat-unit">km/h</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${data.speed?.min || '--'}</b></span>
          <span class="stat-max">max: <b>${data.speed?.max || '--'}</b></span>
        </div>
      </div>
    `;
    // Llamar a los gráficos con los datos completos
    if (window.renderSessionCharts) window.renderSessionCharts(data);
  } catch (error) {
    console.error("Error al cargar datos:", error);
    showErrorMessage();
  }
}

function showNoDataMessage() {
  const summary = document.getElementById('summary');
  summary.innerHTML = `
    <div class="summary-block" style="grid-column: 1 / -1; text-align: center;">
      <h2>📊 No hay datos de sesión</h2>
      <p>No se encontraron sesiones registradas.</p>
      <p>Completa una sesión de entrenamiento para ver las estadísticas aquí.</p>
      <p><small>Si acabas de completar una sesión, espera unos segundos y recarga la página.</small></p>
    </div>
  `;
}

function showErrorMessage() {
  const summary = document.getElementById('summary');
  summary.innerHTML = `
    <div class="summary-block" style="grid-column: 1 / -1; text-align: center;">
      <h2>❌ Error al cargar datos</h2>
      <p>Hubo un problema al cargar los datos de la sesión.</p>
      <p>Verifica tu conexión a internet e intenta nuevamente.</p>
      <p><small>Revisa la consola del navegador para más detalles.</small></p>
    </div>
  `;
}

function formatElapsedTime(milliseconds) {
  if (!milliseconds) return '--';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export function shareSummary() {
  alert("Función de compartir no implementada aún");
}

export function downloadCSV() {
  alert("Función de descarga CSV no implementada aún");
}

// Cargar datos cuando se carga la página
document.addEventListener('DOMContentLoaded', loadSummary);
