console.log("🚀 stats.js cargado correctamente");

import { db } from './firebase.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

let sessionData = null; // Store session data globally in this module

async function loadSummary() {
  try {
    const q = query(collection(db, 'sesiones'), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showNoDataMessage();
      if (window.renderSessionCharts) window.renderSessionCharts({});
      return;
    }

    sessionData = snapshot.docs[0].data();
    displayResults(sessionData);
    
    // Initial chart render
    if (window.renderSessionCharts) {
        window.renderSessionCharts(sessionData);
    }

  } catch (error) {
    console.error("Error al cargar datos:", error);
    showErrorMessage();
  }
}

function formatStat(value, decimals = 0) {
    if (value === null || typeof value === 'undefined' || isNaN(Number(value))) {
        return '--';
    }
    return Number(value).toFixed(decimals);
}

function displayResults(data) {
    const summary = document.getElementById('summary');
    const elapsedTime = formatElapsedTime(data.elapsedTime || 0);
    summary.innerHTML = `
      <div class="summary-block sensor-block">
        <h2>Elapsed Time</h2>
        <div class="stat-main-value">${elapsedTime}</div>
      </div>
      
      <div class="summary-block sensor-block">
        <h2>Distance</h2>
        <div class="stat-main-value">${formatStat(data.distance, 2)} <span class="stat-unit">km</span></div>
      </div>

      <div class="summary-block sensor-block">
        <h2>Heart Rate</h2>
        <div class="stat-main-value">${formatStat(data.bpm?.avg, 0)}</div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.bpm?.min, 0)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.bpm?.max, 0)}</b></span>
        </div>
      </div>

      <div class="summary-block sensor-block">
        <h2>Power</h2>
        <div class="stat-main-value">${formatStat(data.power?.avg, 0)} <span class="stat-unit">W</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.power?.min, 0)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.power?.max, 0)}</b></span>
        </div>
      </div>

      <div class="summary-block sensor-block">
        <h2>Cadence</h2>
        <div class="stat-main-value">${formatStat(data.rpm?.avg, 0)} <span class="stat-unit">rpm</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.rpm?.min, 0)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.rpm?.max, 0)}</b></span>
        </div>
      </div>
      
      <div class="summary-block sensor-block">
        <h2>Km/h</h2>
        <div class="stat-main-value">${formatStat(data.speed?.avg, 1)}</div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.speed?.min, 1)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.speed?.max, 1)}</b></span>
        </div>
      </div>
    `;
}

function showNoDataMessage() {
  const summary = document.getElementById('summary');
  summary.innerHTML = `
    <div class="summary-block sensor-block" style="grid-column: 1 / -1; text-align: center;">
      <h2>No session data</h2>
      <p>Complete a session to see the stats here.</p>
    </div>
  `;
}

function showErrorMessage() {
  const summary = document.getElementById('summary');
  summary.innerHTML = `
    <div class="summary-block sensor-block" style="grid-column: 1 / -1; text-align: center;">
      <h2>Error loading data</h2>
      <p>Check your connection and try again.</p>
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

function setupActionButtons() {
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-csv-btn');

    if (!sessionData) {
        if(shareBtn) shareBtn.disabled = true;
        if(downloadBtn) downloadBtn.disabled = true;
        return;
    }

    if (shareBtn) {
        if (navigator.share) {
            shareBtn.addEventListener('click', handleShare);
        } else {
            shareBtn.disabled = true;
            shareBtn.title = "Web Share API not supported in your browser";
        }
    }
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownloadCSV);
    }
}

function handleShare() {
    const data = sessionData;
    const summaryText =
`🚴‍♂️ FreeBike Session

- Time: ${formatElapsedTime(data.elapsedTime)}
- Distance: ${(data.distance ?? 0).toFixed(2)} km
- Heart Rate: avg ${data.bpm?.avg ?? '--'} bpm (min ${data.bpm?.min ?? '--'}, max ${data.bpm?.max ?? '--'})
- Power: avg ${data.power?.avg ?? '--'} W (min ${data.power?.min ?? '--'}, max ${data.power?.max ?? '--'})
- Cadence: avg ${data.rpm?.avg ?? '--'} rpm (min ${data.rpm?.min ?? '--'}, max ${data.rpm?.max ?? '--'})
- Speed: avg ${data.speed?.avg ?? '--'} km/h (min ${data.speed?.min ?? '--'}, max ${data.speed?.max ?? '--'})`;

    // Crear enlace de WhatsApp
    const whatsappText = encodeURIComponent(summaryText);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

    // Mostrar opciones de compartir
    const shareOptions = [
        { name: 'WhatsApp', action: () => window.open(whatsappUrl, '_blank') },
        { name: 'Compartir nativo', action: () => shareNative(summaryText) },
        { name: 'Copiar al portapapeles', action: () => copyToClipboard(summaryText) }
    ];

    // Crear modal de opciones
    showShareModal(shareOptions);
}

function shareNative(text) {
    if (navigator.share) {
        navigator.share({
            title: 'My FreeBike Session',
            text: text
        }).catch(error => console.error('Error sharing:', error));
    } else {
        copyToClipboard(text);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        alert('Resumen copiado al portapapeles');
    } else {
        alert('No se pudo copiar al portapapeles');
    }
}

function showShareModal(options) {
    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--card-bg-color, #fff);
        border-radius: 12px;
        padding: 1.5rem;
        max-width: 300px;
        width: 90%;
        text-align: center;
        border: 1px solid var(--border-color, #ddd);
    `;

    const title = document.createElement('h3');
    title.textContent = 'Compartir sesión';
    title.style.cssText = `
        margin: 0 0 1rem 0;
        color: var(--fg-color, #333);
        font-size: 1.2rem;
    `;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    `;

    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.name;
        button.style.cssText = `
            background: var(--primary-color, #007bff);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 0.8rem;
            font-size: 1rem;
            cursor: pointer;
            transition: opacity 0.3s;
        `;
        button.onclick = () => {
            option.action();
            document.body.removeChild(modal);
        };
        button.onmouseover = () => button.style.opacity = '0.8';
        button.onmouseout = () => button.style.opacity = '1';
        buttonsContainer.appendChild(button);
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    cancelButton.style.cssText = `
        background: transparent;
        color: var(--secondary-color, #666);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 8px;
        padding: 0.8rem;
        font-size: 1rem;
        cursor: pointer;
        margin-top: 0.5rem;
        width: 100%;
    `;
    cancelButton.onclick = () => document.body.removeChild(modal);

    content.appendChild(title);
    content.appendChild(buttonsContainer);
    content.appendChild(cancelButton);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Cerrar al hacer clic fuera del modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

function handleDownloadCSV() {
    const data = sessionData;
    
    const headers = ['timestamp', 'bpm', 'power', 'rpm', 'speed_kmh'];
    
    // Create a map of timestamps to data points
    const dataMap = new Map();
    
    // Add heart rate data with actual timestamps
    if (data.bpm?.values && data.bpm.values.length > 0) {
        data.bpm.values.forEach((value, index) => {
            const timestamp = data.bpm.timestamps && data.bpm.timestamps[index] 
                ? data.bpm.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '' });
            }
            dataMap.get(timestamp).bpm = value;
        });
    }
    
    // Add power data with actual timestamps
    if (data.power?.values && data.power.values.length > 0) {
        data.power.values.forEach((value, index) => {
            const timestamp = data.power.timestamps && data.power.timestamps[index] 
                ? data.power.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '' });
            }
            dataMap.get(timestamp).power = value;
        });
    }
    
    // Add RPM data with actual timestamps
    if (data.rpm?.values && data.rpm.values.length > 0) {
        data.rpm.values.forEach((value, index) => {
            const timestamp = data.rpm.timestamps && data.rpm.timestamps[index] 
                ? data.rpm.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '' });
            }
            dataMap.get(timestamp).rpm = value;
        });
    }
    
    // Add speed data with actual timestamps
    if (data.speed?.values && data.speed.values.length > 0) {
        data.speed.values.forEach((value, index) => {
            const timestamp = data.speed.timestamps && data.speed.timestamps[index] 
                ? data.speed.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '' });
            }
            dataMap.get(timestamp).speed = value;
        });
    }
    
    // Convert map to sorted array
    const sortedData = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    sortedData.forEach(row => {
        // Convert timestamp to readable format without milliseconds
        const date = new Date(row.timestamp);
        const readableTimestamp = date.toISOString().slice(0, 19).replace('T', ' ');
        
        const csvRow = [
            readableTimestamp,
            row.bpm || '',
            row.power || '',
            row.rpm || '',
            row.speed || ''
        ];
        csvContent += csvRow.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const sessionDate = new Date(data.startTime.toMillis()).toISOString().slice(0, 10);
    link.setAttribute("download", `freebike_session_${sessionDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function shareSummary() {
  alert("Función de compartir no implementada aún");
}

export function downloadCSV() {
  alert("Función de descarga CSV no implementada aún");
}

document.addEventListener('DOMContentLoaded', () => {
    loadSummary().then(() => {
        setupActionButtons();
    });
});

// Re-render charts when tab becomes visible
document.querySelector('[data-tab="charts"]').addEventListener('click', () => {
    if (sessionData && window.renderSessionCharts) {
        // Delay slightly to allow tab to transition
        setTimeout(() => window.renderSessionCharts(sessionData), 50);
    }
});
