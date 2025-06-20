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
        <div class="value">${elapsedTime}</div>
      </div>
      <div class="summary-block sensor-block">
        <h2>Distance</h2>
        <div class="value">${formatStat(data.distance, 2)} km</div>
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
    const summaryText = `Check out my ride on FreeBike!
- Time: ${formatElapsedTime(data.elapsedTime)}
- Distance: ${data.distance.toFixed(2)} km
- Avg Power: ${data.power.avg} W
- Avg HR: ${data.bpm.avg} bpm`;

    navigator.share({
        title: 'My FreeBike Session',
        text: summaryText,
        url: window.location.href
    }).catch(error => console.error('Error sharing:', error));
}

function handleDownloadCSV() {
    const data = sessionData;
    const headers = ['timestamp_ms', 'bpm', 'power', 'rpm', 'speed_kmh'];
    
    // Find the max length of data arrays
    const maxLength = Math.max(
        data.bpm?.values?.length || 0,
        data.power?.values?.length || 0,
        data.rpm?.values?.length || 0,
        data.speed?.values?.length || 0
    );

    let csvContent = headers.join(',') + '\\n';

    for (let i = 0; i < maxLength; i++) {
        const row = [
            data.startTime.toMillis() + (i * 1000), // Approximate timestamp
            data.bpm?.values[i] || '',
            data.power?.values[i] || '',
            data.rpm?.values[i] || '',
            data.speed?.values[i] || ''
        ];
        csvContent += row.join(',') + '\\n';
    }

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
