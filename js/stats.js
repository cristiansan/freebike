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

      <div class="summary-block sensor-block">
        <h2>Watts/h</h2>
        <div class="stat-main-value">${formatStat(data.wattsPerHour?.avg, 0)} <span class="stat-unit">Wh</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.wattsPerHour?.min, 0)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.wattsPerHour?.max, 0)}</b></span>
        </div>
      </div>

      <div class="summary-block sensor-block">
        <h2>Speed Sensor</h2>
        <div class="stat-main-value">${formatStat(data.sensorSpeed?.avg, 1)} <span class="stat-unit">km/h</span></div>
        <div class="stat-minmax-row">
          <span class="stat-min">min: <b>${formatStat(data.sensorSpeed?.min, 1)}</b></span>
          <span class="stat-max">max: <b>${formatStat(data.sensorSpeed?.max, 1)}</b></span>
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

async function createShareableImage(data, theme) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = 540;
    const height = 480;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const colors = {
        bg: theme === 'dark' ? '#333333' : '#F5F5F5',
        fg: theme === 'dark' ? '#FFFFFF' : '#333333',
        primary: theme === 'dark' ? '#F2C464' : '#367AF6',
        secondary: theme === 'dark' ? '#A9A9A9' : '#5A5A5A',
    };
    const font = '"Courier New", Courier, monospace';

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = colors.primary;
    ctx.font = `bold 26px ${font}`;
    ctx.textAlign = 'center';
    ctx.fillText('FreeBike Session', width / 2, 50);

    // Main Stats (Distance, Time, Avg Speed)
    const mainStats = [
        { label: 'Distance (km)', value: (data.distance || 0).toFixed(2) },
        { label: 'Time', value: formatElapsedTime(data.elapsedTime) },
        { label: 'Avg Speed (km/h)', value: (data.speed?.avg || 0).toFixed(1) }
    ];

    mainStats.forEach((stat, i) => {
        const x = (width / 3) * (i + 0.5);
        ctx.textAlign = 'center';

        // Value
        ctx.font = `bold 42px ${font}`;
        ctx.fillStyle = colors.fg;
        ctx.fillText(stat.value, x, 140);

        // Label
        ctx.font = `16px ${font}`;
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'center';
        ctx.fillText(stat.label, x, 165);
    });

    // Divider
    ctx.beginPath();
    ctx.moveTo(40, 210);
    ctx.lineTo(width - 40, 210);
    ctx.strokeStyle = colors.secondary;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Secondary Stats Grid
    const secondaryStats = [
        { label: 'Avg HR (bpm)', value: data.bpm?.avg || 0 },
        { label: 'Max HR (bpm)', value: data.bpm?.max || 0 },
        { label: 'Avg Power (W)', value: data.power?.avg || 0 },
        { label: 'Max Power (W)', value: data.power?.max || 0 },
        { label: 'Avg Cadence (rpm)', value: data.rpm?.avg || 0 },
        { label: 'Max Cadence (rpm)', value: data.rpm?.max || 0 },
        { label: 'Avg Watts/h (Wh)', value: data.wattsPerHour?.avg || 0 },
        { label: 'Sensor Speed (km/h)', value: data.sensorSpeed?.avg || 0 },
    ];
    
    ctx.font = `20px ${font}`;
    ctx.textAlign = 'center';
    secondaryStats.forEach((stat, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = width / 4 * (col * 2 + 1);
        const y = 250 + row * 60;

        // Value
        ctx.fillStyle = colors.fg;
        ctx.fillText(stat.value, x, y);
        
        // Label
        ctx.font = `14px ${font}`;
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'center';
        ctx.fillText(stat.label, x, y + 20);

        ctx.font = `20px ${font}`; // Reset font for next value
    });

    return new Promise(resolve => {
        canvas.toBlob(blob => {
            resolve(blob);
        }, 'image/png');
    });
}

async function handleShare() {
    const data = sessionData;
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const summaryText = `🚴‍♂️ FreeBike Session - Time: ${formatElapsedTime(data.elapsedTime)}, Distance: ${(data.distance || 0).toFixed(2)} km, Avg Speed: ${(data.speed?.avg || 0).toFixed(1)} km/h, Avg Power: ${(data.power?.avg || 0)} W, Avg HR: ${(data.bpm?.avg || 0)} bpm, Watts/h: ${(data.wattsPerHour?.avg || 0)} Wh`;

    try {
        const imageBlob = await createShareableImage(data, currentTheme);
        const file = new File([imageBlob], 'freebike-summary.png', { type: 'image/png' });

        // Comprobar si se pueden compartir archivos
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'My FreeBike Session',
                text: summaryText,
                files: [file],
            });
        } else {
            // Fallback para navegadores que no pueden compartir archivos (ej. Firefox desktop)
            console.log("File sharing not supported, falling back to text.");
            copyToClipboardWithAlert(summaryText);
        }
    } catch (error) {
        // Fallback si hay cualquier error durante la creación o compartición de la imagen
        console.error('Error creating or sharing image:', error);
        copyToClipboardWithAlert(summaryText);
    }
}

function copyToClipboardWithAlert(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => alert('¡Resumen copiado al portapapeles!'))
            .catch(err => {
                console.error('Error al copiar:', err);
                alert('No se pudo compartir ni copiar el resumen.');
            });
    } else {
        alert('La función para compartir o copiar no está disponible en este navegador.');
    }
}

function handleDownloadCSV() {
    const data = sessionData;
    
    const headers = ['timestamp', 'bpm', 'power', 'rpm', 'speed_kmh', 'watts_per_hour', 'sensor_speed_kmh'];
    
    // Create a map of timestamps to data points
    const dataMap = new Map();
    
    // Add heart rate data with actual timestamps
    if (data.bpm?.values && data.bpm.values.length > 0) {
        data.bpm.values.forEach((value, index) => {
            const timestamp = data.bpm.timestamps && data.bpm.timestamps[index] 
                ? data.bpm.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
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
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
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
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
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
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
            }
            dataMap.get(timestamp).speed = value;
        });
    }
    
    // Add watts per hour data with actual timestamps
    if (data.wattsPerHour?.values && data.wattsPerHour.values.length > 0) {
        data.wattsPerHour.values.forEach((value, index) => {
            const timestamp = data.wattsPerHour.timestamps && data.wattsPerHour.timestamps[index] 
                ? data.wattsPerHour.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
            }
            dataMap.get(timestamp).wattsPerHour = value;
        });
    }
    
    // Add sensor speed data with actual timestamps
    if (data.sensorSpeed?.values && data.sensorSpeed.values.length > 0) {
        data.sensorSpeed.values.forEach((value, index) => {
            const timestamp = data.sensorSpeed.timestamps && data.sensorSpeed.timestamps[index] 
                ? data.sensorSpeed.timestamps[index] 
                : data.startTime.toMillis() + (index * 1000);
            if (!dataMap.has(timestamp)) {
                dataMap.set(timestamp, { timestamp, bpm: '', power: '', rpm: '', speed: '', wattsPerHour: '', sensorSpeed: '' });
            }
            dataMap.get(timestamp).sensorSpeed = value;
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
            row.speed || '',
            row.wattsPerHour || '',
            row.sensorSpeed || ''
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
