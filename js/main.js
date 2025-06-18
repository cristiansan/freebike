import { setupUI } from './ui.js';
import { connectHR, connectPower, connectRPM, startGPS } from './app.js';
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

setupUI(connectHR, connectPower, connectRPM);
startGPS(); // Activa el GPS al iniciar

let isRecording = false;
let isPaused = false;
let holdTimeout = null;
let holdTriggered = false;
let startTime = null;
let pauseStart = null;
let pausedDuration = 0;
let timeInterval = null;
let wakeLock = null;

// Variables para estadísticas acumuladas
let sessionStats = {
  bpm: { values: [], sum: 0, min: null, max: null },
  power: { values: [], sum: 0, min: null, max: null },
  rpm: { values: [], sum: 0, min: null, max: null },
  speed: { values: [], sum: 0, min: null, max: null },
  distance: 0,
  startTime: null,
  endTime: null
};

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
    const docRef = await addDoc(collection(db, "sesiones"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("Sesión guardada con ID:", docRef.id);
  } catch (e) {
    console.error("Error al guardar sesión:", e);
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
  if (!isRecording) {
    startStopLabel.textContent = "▶️ Start";
    startStopBtn.classList.remove("recording", "paused", "holding");
  } else if (isPaused) {
    startStopLabel.textContent = "⏸️ HOLD TO STOP";
    startStopBtn.classList.remove("recording");
    startStopBtn.classList.add("paused");
  } else {
    startStopLabel.textContent = "🔴 Grabando sesión...";
    startStopBtn.classList.add("recording");
    startStopBtn.classList.remove("paused", "holding");
  }
}

// --- Click corto: Start / Pause / Resume ---
function handleClick() {
  if (holdTriggered) return;

  if (!isRecording) {
    isRecording = true;
    isPaused = false;
    startTime = new Date();
    pausedDuration = 0;
    
    // Inicializar estadísticas de sesión
    sessionStats = {
      bpm: { values: [], sum: 0, min: null, max: null },
      power: { values: [], sum: 0, min: null, max: null },
      rpm: { values: [], sum: 0, min: null, max: null },
      speed: { values: [], sum: 0, min: null, max: null },
      distance: 0,
      startTime: startTime,
      endTime: null
    };
    
    timeInterval = setInterval(updateElapsedTime, 1000);
    updateElapsedTime();
    requestWakeLock();
    guardarSesionActual();
    launchFullscreen(); // ⬅️ Entrar en pantalla completa al comenzar
  } else if (!isPaused) {
    isPaused = true;
    pauseStart = new Date();
  } else {
    isPaused = false;
    if (pauseStart) {
      pausedDuration += new Date() - pauseStart;
      pauseStart = null;
    }
  }

  updateButtonUI();
}

// --- Hold largo: detener grabación ---
function startHoldToStop() {
  if (isRecording && isPaused) {
    holdTriggered = false;
    startStopBtn.classList.add('holding');
    holdTimeout = setTimeout(() => {
      holdTriggered = true;
      isRecording = false;
      isPaused = false;
      
      // Guardar estadísticas finales
      sessionStats.endTime = new Date();
      const finalStats = {
        // Tiempo transcurrido
        elapsedTime: getElapsedTimeMs(),
        
        // Distancia
        distance: sessionStats.distance,
        
        // FC promedio, mínima y máxima
        bpm: {
          avg: sessionStats.bpm.values.length > 0 ? Math.round(sessionStats.bpm.sum / sessionStats.bpm.values.length) : 0,
          min: sessionStats.bpm.min || 0,
          max: sessionStats.bpm.max || 0,
          count: sessionStats.bpm.values.length
        },
        
        // Potencia promedio, mínima y máxima
        power: {
          avg: sessionStats.power.values.length > 0 ? Math.round(sessionStats.power.sum / sessionStats.power.values.length) : 0,
          min: sessionStats.power.min || 0,
          max: sessionStats.power.max || 0,
          count: sessionStats.power.values.length
        },
        
        // Cadencia promedio, mínima y máxima
        rpm: {
          avg: sessionStats.rpm.values.length > 0 ? Math.round(sessionStats.rpm.sum / sessionStats.rpm.values.length) : 0,
          min: sessionStats.rpm.min || 0,
          max: sessionStats.rpm.max || 0,
          count: sessionStats.rpm.values.length
        },
        
        // Velocidad promedio, mínima y máxima
        speed: {
          avg: sessionStats.speed.values.length > 0 ? Math.round(sessionStats.speed.sum / sessionStats.speed.values.length * 10) / 10 : 0,
          min: sessionStats.speed.min || 0,
          max: sessionStats.speed.max || 0,
          count: sessionStats.speed.values.length
        },
        
        startTime: sessionStats.startTime,
        endTime: sessionStats.endTime
      };
      
      console.log("Estadísticas finales:", finalStats);
      saveSession(finalStats);
      
      // Resetear variables
      startTime = null;
      pauseStart = null;
      pausedDuration = 0;
      clearInterval(timeInterval);
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
  if (holdTimeout) {
    clearTimeout(holdTimeout);
    holdTimeout = null;
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
  if (!isRecording || isPaused || value === null || value === undefined || value === 0) return;
  
  if (sessionStats[type]) {
    sessionStats[type].values.push(value);
    sessionStats[type].sum += value;
    
    if (sessionStats[type].min === null || value < sessionStats[type].min) {
      sessionStats[type].min = value;
    }
    if (sessionStats[type].max === null || value > sessionStats[type].max) {
      sessionStats[type].max = value;
    }
  }
}

// Exponer la función globalmente para que ui.js pueda usarla
window.updateSessionStats = updateSessionStats;

// Exponer sessionStats globalmente para que app.js pueda acceder a él
window.sessionStats = sessionStats;
