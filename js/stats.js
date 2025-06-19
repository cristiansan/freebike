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

export async function shareSummary() {
  try {
    // Importar html2canvas dinámicamente
    const html2canvas = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
    
    // Mostrar mensaje de carga
    const shareBtn = document.querySelector('button[onclick="shareSummary()"]');
    const originalText = shareBtn.innerHTML;
    shareBtn.innerHTML = '⏳';
    shareBtn.disabled = true;
    
    // Capturar la pantalla de resultados
    const resultsTab = document.getElementById('tab-content-resultados');
    const canvas = await html2canvas.default(resultsTab, {
      backgroundColor: '#000',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    // Convertir canvas a blob
    canvas.toBlob(async (blob) => {
      try {
        // Crear archivo para compartir
        const file = new File([blob], 'resultados-entrenamiento.png', { type: 'image/png' });
        
        // Verificar si el navegador soporta Web Share API
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Resultados de mi entrenamiento',
            text: '¡Mira mis resultados de entrenamiento!',
            files: [file]
          });
        } else {
          // Fallback: descargar la imagen
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'resultados-entrenamiento.png';
          a.click();
          URL.revokeObjectURL(url);
          alert('Imagen descargada. Tu navegador no soporta compartir archivos.');
        }
      } catch (error) {
        console.error('Error al compartir:', error);
        alert('Error al compartir. La imagen se descargará automáticamente.');
        
        // Fallback: descargar la imagen
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados-entrenamiento.png';
        a.click();
        URL.revokeObjectURL(url);
      }
      
      // Restaurar botón
      shareBtn.innerHTML = originalText;
      shareBtn.disabled = false;
    }, 'image/png');
    
  } catch (error) {
    console.error('Error al generar imagen:', error);
    alert('Error al generar la imagen para compartir.');
    
    // Restaurar botón
    const shareBtn = document.querySelector('button[onclick="shareSummary()"]');
    shareBtn.innerHTML = '📤';
    shareBtn.disabled = false;
  }
}

export async function downloadCSV() {
  try {
    // Obtener datos de la sesión actual
    const q = query(collection(db, 'sesiones'), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      alert('No hay datos de sesión para descargar.');
      return;
    }
    
    const data = snapshot.docs[0].data();
    
    // Mostrar mensaje de carga
    const downloadBtn = document.querySelector('button[onclick="downloadCSV()"]');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '⏳';
    downloadBtn.disabled = true;
    
    // Crear contenido CSV
    let csvContent = 'Tipo,Valor,Unidad\n';
    
    // Agregar datos básicos
    csvContent += `Tiempo transcurrido,${formatElapsedTime(data.elapsedTime || 0)},hh:mm:ss\n`;
    csvContent += `Distancia,${data.distance ? data.distance.toFixed(2) : '0'},km\n`;
    
    // Agregar datos de BPM
    if (data.bpm) {
      csvContent += `Frecuencia Cardíaca Promedio,${data.bpm.avg || '0'},bpm\n`;
      csvContent += `Frecuencia Cardíaca Mínima,${data.bpm.min || '0'},bpm\n`;
      csvContent += `Frecuencia Cardíaca Máxima,${data.bpm.max || '0'},bpm\n`;
    }
    
    // Agregar datos de Potencia
    if (data.power) {
      csvContent += `Potencia Promedio,${data.power.avg || '0'},W\n`;
      csvContent += `Potencia Mínima,${data.power.min || '0'},W\n`;
      csvContent += `Potencia Máxima,${data.power.max || '0'},W\n`;
    }
    
    // Agregar datos de RPM
    if (data.rpm) {
      csvContent += `Cadencia Promedio,${data.rpm.avg || '0'},rpm\n`;
      csvContent += `Cadencia Mínima,${data.rpm.min || '0'},rpm\n`;
      csvContent += `Cadencia Máxima,${data.rpm.max || '0'},rpm\n`;
    }
    
    // Agregar datos de Velocidad
    if (data.speed) {
      csvContent += `Velocidad Promedio,${data.speed.avg || '0'},km/h\n`;
      csvContent += `Velocidad Mínima,${data.speed.min || '0'},km/h\n`;
      csvContent += `Velocidad Máxima,${data.speed.max || '0'},km/h\n`;
    }
    
    // Agregar datos de series temporales si están disponibles
    if (data.bpm && data.bpm.values && data.bpm.values.length > 0) {
      csvContent += '\nSerie Temporal - Frecuencia Cardíaca\n';
      csvContent += 'Muestra,BPM\n';
      data.bpm.values.forEach((value, index) => {
        csvContent += `${index + 1},${value}\n`;
      });
    }
    
    if (data.power && data.power.values && data.power.values.length > 0) {
      csvContent += '\nSerie Temporal - Potencia\n';
      csvContent += 'Muestra,Potencia(W)\n';
      data.power.values.forEach((value, index) => {
        csvContent += `${index + 1},${value}\n`;
      });
    }
    
    if (data.rpm && data.rpm.values && data.rpm.values.length > 0) {
      csvContent += '\nSerie Temporal - Cadencia\n';
      csvContent += 'Muestra,RPM\n';
      data.rpm.values.forEach((value, index) => {
        csvContent += `${index + 1},${value}\n`;
      });
    }
    
    if (data.speed && data.speed.values && data.speed.values.length > 0) {
      csvContent += '\nSerie Temporal - Velocidad\n';
      csvContent += 'Muestra,Velocidad(km/h)\n';
      data.speed.values.forEach((value, index) => {
        csvContent += `${index + 1},${value}\n`;
      });
    }
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entrenamiento-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Restaurar botón
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;
    
  } catch (error) {
    console.error('Error al descargar CSV:', error);
    alert('Error al generar el archivo CSV.');
    
    // Restaurar botón
    const downloadBtn = document.querySelector('button[onclick="downloadCSV()"]');
    downloadBtn.innerHTML = '📄';
    downloadBtn.disabled = false;
  }
}

// Cargar datos cuando se carga la página
document.addEventListener('DOMContentLoaded', loadSummary);
