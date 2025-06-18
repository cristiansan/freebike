import { setupUI } from './ui.js';
import { connectHR, connectPower, connectRPM, startGPS } from './app.js';
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

setupUI(connectHR, connectPower, connectRPM);
startGPS(); // Activa el GPS al iniciar

window.isRecording = false;
window.isPaused = false;
window.holdTimeout = null;
window.holdTriggered = false;
window.startTime = null;
window.pauseStart = null;
window.pausedDuration = 0;
window.timeInterval = null;
window.wakeLock = null;

// Variables para estadísticas acumuladas
typeof window.sessionStats === 'undefined' && (window.sessionStats = {
  bpm: { values: [], sum: 0, min: null, max: null },
  power: { values: [], sum: 0, min: null, max: null },
  rpm: { values: [], sum: 0, min: null, max: null },
  speed: { values: [], sum: 0, min: null, max: null },
  distance: 0,
  startTime: null,
  endTime: null
});

const startStopBtn = document.getElementById('startStopBtn');
const startStopLabel = document.getElementById('startStopLabel');
const sessionTimeDisplay = document.getElementById('session-time');

// --- Mantener pantalla activa ---
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Wake Lock activado');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock liberado');
    });
  } catch (err) {
    console.error('Error al activar Wake Lock:', err);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// --- Activar modo pantalla completa ---
function launchFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

// --- Tiempo real de sesión ---
function getElapsedTimeMs() {
  if (!startTime) return 0;
  const now = new Date();
  const elapsed = now - startTime - pausedDuration;
  return elapsed;
}

function updateElapsedTime() {
  const ms = getElapsedTimeMs();
  const seconds = Math.floor(ms / 1000);
  const min = Math.floor(seconds / 60).toString().padStart(2, '0');
  const sec = (seconds % 60).toString().padStart(2, '0');
  sessionTimeDisplay.textContent = `⏱ ${min}:${sec}`;
}

// --- Guardar sesión en Firebase ---
async function saveSession(data) {
  try {
    console.log("Intentando guardar sesión en Firebase...");
    const docRef = await addDoc(collection(db, "sesiones"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("✅ Sesión guardada exitosamente con ID:", docRef.id);
  } catch (e) {
    console.error("❌ Error al guardar sesión:", e);
    console.error("Datos que se intentaron guardar:", data);
  }
}

// --- Mostrar en lista ---
function appendSessionToList(data) {
  const li = document.createElement('li');
  const fecha = new Date();
  const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
  li.textContent = `[${fechaStr}] FC: ${data.bpm}, Pot: ${data.power}, RPM: ${data.rpm}, Vel: ${data.speed} km/h, Dist: ${data.distance} km`;
  document.getElementById('session-list').prepend(li);
}

// --- Guardar datos actuales ---
function guardarSesionActual() {
  const hrElement = document.getElementById('hr-display');
  const powerElement = document.getElementById('power');
  const rpmElement = document.getElementById('rpm');
  const speedElement = document.getElementById('gps-speed');
  const distanceElement = document.getElementById('gps-distance');

  // Obtener valores actuales
  const currentBpm = hrElement ? parseInt(hrElement.textContent.replace(/[^\d]/g, '')) || 0 : 0;
  const currentPower = powerElement ? parseInt(powerElement.textContent.replace(/[^\d]/g, '')) || 0 : 0;
  const currentRpm = rpmElement ? parseInt(rpmElement.textContent.replace(/[^\d]/g, '')) || 0 : 0;
  const currentSpeed = speedElement ? parseFloat(speedElement.textContent.replace(/[^\d.]/g, '')) || 0 : 0;
  const currentDistance = distanceElement ? parseFloat(distanceElement.textContent.replace(/[^\d.]/g, '')) || 0 : 0;

  // Actualizar estadísticas acumuladas
  updateSessionStats('bpm', currentBpm);
  updateSessionStats('power', currentPower);
  updateSessionStats('rpm', currentRpm);
  updateSessionStats('speed', currentSpeed);
  sessionStats.distance = currentDistance;

  // Solo guardar al final de la sesión, no al inicio
  // saveSession(sessionData);
  // appendSessionToList(sessionData);
}

// --- UI del botón ---
function updateButtonUI() {
  if (!window.isRecording) {
    startStopLabel.textContent = "▶️ Start";
    startStopBtn.classList.remove("recording", "paused", "holding");
  } else if (window.isPaused) {
    startStopLabel.textContent = "⏸️ HOLD TO STOP";
    startStopBtn.classList.remove("recording");
    startStopBtn.classList.add("paused");
  } else {
    startStopLabel.textContent = "🔴 Grabando sesión...";
    startStopBtn.classList.add("recording");
    startStopBtn.classList.remove("paused", "holding");
  }
}
window.updateButtonUI = updateButtonUI;

// --- Click corto: Start / Pause / Resume ---
function handleClick() {
  if (holdTriggered) return;

  if (!window.isRecording) {
    window.isRecording = true;
    window.isPaused = false;
    window.startTime = new Date();
    window.pausedDuration = 0;
    
    // Inicializar estadísticas de sesión
    window.sessionStats = {
      bpm: { values: [], sum: 0, min: null, max: null },
      power: { values: [], sum: 0, min: null, max: null },
      rpm: { values: [], sum: 0, min: null, max: null },
      speed: { values: [], sum: 0, min: null, max: null },
      distance: 0,
      startTime: window.startTime,
      endTime: null
    };
    
    window.timeInterval = setInterval(updateElapsedTime, 1000);
    updateElapsedTime();
    requestWakeLock();
    guardarSesionActual();
    launchFullscreen(); // ⬅️ Entrar en pantalla completa al comenzar
  } else if (!window.isPaused) {
    window.isPaused = true;
    window.pauseStart = new Date();
  } else {
    window.isPaused = false;
    if (window.pauseStart) {
      window.pausedDuration += new Date() - window.pauseStart;
      window.pauseStart = null;
    }
  }

  updateButtonUI();
}

// --- Hold largo: detener grabación ---
async function startHoldToStop() {
  if (window.isRecording && window.isPaused) {
    window.holdTriggered = false;
    startStopBtn.classList.add('holding');
    window.holdTimeout = setTimeout(async () => {
      window.holdTriggered = true;
      window.isRecording = false;
      window.isPaused = false;
      
      // Guardar estadísticas finales
      window.sessionStats.endTime = new Date();
      
      // Limitar el tamaño de los arrays para evitar problemas de Firebase
      const maxArraySize = 100; // Máximo 100 valores por array
      
      const finalStats = {
        // Tiempo transcurrido
        elapsedTime: getElapsedTimeMs(),
        
        // Distancia
        distance: window.sessionStats.distance,
        
        // FC promedio, mínima y máxima
        bpm: {
          avg: window.sessionStats.bpm.values.length > 0 ? Math.round(window.sessionStats.bpm.sum / window.sessionStats.bpm.values.length) : 0,
          min: window.sessionStats.bpm.min || 0,
          max: window.sessionStats.bpm.max || 0,
          count: window.sessionStats.bpm.values.length,
          values: window.sessionStats.bpm.values.slice(-maxArraySize) // Solo los últimos 100 valores
        },
        
        // Potencia promedio, mínima y máxima
        power: {
          avg: window.sessionStats.power.values.length > 0 ? Math.round(window.sessionStats.power.sum / window.sessionStats.power.values.length) : 0,
          min: window.sessionStats.power.min || 0,
          max: window.sessionStats.power.max || 0,
          count: window.sessionStats.power.values.length,
          values: window.sessionStats.power.values.slice(-maxArraySize)
        },
        
        // Cadencia promedio, mínima y máxima
        rpm: {
          avg: window.sessionStats.rpm.values.length > 0 ? Math.round(window.sessionStats.rpm.sum / window.sessionStats.rpm.values.length) : 0,
          min: window.sessionStats.rpm.min || 0,
          max: window.sessionStats.rpm.max || 0,
          count: window.sessionStats.rpm.values.length,
          values: window.sessionStats.rpm.values.slice(-maxArraySize)
        },
        
        // Velocidad promedio, mínima y máxima
        speed: {
          avg: window.sessionStats.speed.values.length > 0 ? Math.round(window.sessionStats.speed.sum / window.sessionStats.speed.values.length * 10) / 10 : 0,
          min: window.sessionStats.speed.min || 0,
          max: window.sessionStats.speed.max || 0,
          count: window.sessionStats.speed.values.length,
          values: window.sessionStats.speed.values.slice(-maxArraySize)
        },
        
        startTime: window.sessionStats.startTime,
        endTime: window.sessionStats.endTime
      };
      
      console.log("BPM values:", window.sessionStats.bpm.values);
      console.log("POWER values:", window.sessionStats.power.values);
      console.log("RPM values:", window.sessionStats.rpm.values);
      console.log("SPEED values:", window.sessionStats.speed.values);
      console.log("Final stats a guardar:", finalStats);
      
      // Guardar la sesión
      await saveSession(finalStats);
      
      // Resetear variables
      window.startTime = null;
      window.pauseStart = null;
      window.pausedDuration = 0;
      clearInterval(window.timeInterval);
      sessionTimeDisplay.textContent = "⏱ 00:00";
      releaseWakeLock();
      updateButtonUI();
      console.log("Sesión detenida.");

      // Deshabilitar botón por 2 segundos para evitar que se reinicie al soltar
      startStopBtn.disabled = true;
      setTimeout(() => {
        startStopBtn.disabled = false;
      }, 2000);
       // Redirigir a la página de resumen
      setTimeout(() => {
        window.location.href = 'stats.html';
      }, 500);

    }, 1500);
  }
}

function cancelHoldToStop() {
  if (window.holdTimeout) {
    clearTimeout(window.holdTimeout);
    window.holdTimeout = null;
  }
  startStopBtn.classList.remove('holding');
}

// --- Eventos del botón ---
startStopBtn.addEventListener('click', handleClick);
startStopBtn.addEventListener('mousedown', startHoldToStop);
startStopBtn.addEventListener('mouseup', cancelHoldToStop);
startStopBtn.addEventListener('mouseleave', cancelHoldToStop);
startStopBtn.addEventListener('touchstart', startHoldToStop);
startStopBtn.addEventListener('touchend', cancelHoldToStop);
startStopBtn.addEventListener('touchcancel', cancelHoldToStop);

// Función para actualizar estadísticas
function updateSessionStats(type, value) {
  if (!window.isRecording || window.isPaused || value === null || value === undefined || value === 0) return;
  if (window.sessionStats[type]) {
    window.sessionStats[type].values = window.sessionStats[type].values || [];
    window.sessionStats[type].values.push(value);
    window.sessionStats[type].sum += value;
    if (window.sessionStats[type].min === null || value < window.sessionStats[type].min) {
      window.sessionStats[type].min = value;
    }
    if (window.sessionStats[type].max === null || value > window.sessionStats[type].max) {
      window.sessionStats[type].max = value;
    }
  }
}

// Exponer la función globalmente para que ui.js pueda usarla
window.updateSessionStats = updateSessionStats;
