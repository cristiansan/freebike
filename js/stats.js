console.log("🚀 stats.js cargado correctamente");

import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

async function loadSummary() {
  try {
    console.log("Cargando datos de la sesión...");
    console.log("Firebase db object:", db);
    
    const q = query(collection(db, 'sesiones'), orderBy('createdAt', 'desc'), limit(1));
    console.log("Query creada:", q);
    
    const snapshot = await getDocs(q);
    console.log("Snapshot obtenido:", snapshot);
    console.log("Snapshot empty:", snapshot.empty);
    console.log("Snapshot size:", snapshot.size);
    
    if (snapshot.empty) {
      console.log("No se encontraron sesiones");
      showNoDataMessage();
      return;
    }

    const data = snapshot.docs[0].data();
    console.log("Datos de la sesión:", data);
    console.log("createdAt:", data.createdAt);
    console.log("createdAt type:", typeof data.createdAt);
    
    const summary = document.getElementById('summary');
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    console.log("Fecha procesada:", createdAt);
    
    // Formatear tiempo transcurrido
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
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Promedio</span>
            <span class="stat-value">${data.bpm?.avg || '--'} bpm</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mínima</span>
            <span class="stat-value">${data.bpm?.min || '--'} bpm</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Máxima</span>
            <span class="stat-value">${data.bpm?.max || '--'} bpm</span>
          </div>
        </div>
      </div>
      
      <div class="summary-block">
        <h2>⚡ Potencia</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Promedio</span>
            <span class="stat-value">${data.power?.avg || '--'} W</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mínima</span>
            <span class="stat-value">${data.power?.min || '--'} W</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Máxima</span>
            <span class="stat-value">${data.power?.max || '--'} W</span>
          </div>
        </div>
      </div>
      
      <div class="summary-block">
        <h2>🔄 Cadencia</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Promedio</span>
            <span class="stat-value">${data.rpm?.avg || '--'} rpm</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mínima</span>
            <span class="stat-value">${data.rpm?.min || '--'} rpm</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Máxima</span>
            <span class="stat-value">${data.rpm?.max || '--'} rpm</span>
          </div>
        </div>
      </div>
      
      <div class="summary-block">
        <h2>🚴 Velocidad</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Promedio</span>
            <span class="stat-value">${data.speed?.avg || '--'} km/h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mínima</span>
            <span class="stat-value">${data.speed?.min || '--'} km/h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Máxima</span>
            <span class="stat-value">${data.speed?.max || '--'} km/h</span>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar datos:", error);
    console.error("Error stack:", error.stack);
    showErrorMessage();
  }
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

export function shareSummary() {
  alert("Función de compartir no implementada aún");
}

export function downloadCSV() {
  alert("Función de descarga CSV no implementada aún");
}

// Cargar datos cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM cargado, iniciando carga de datos...");
  loadSummary();
});
