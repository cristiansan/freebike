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
  const fecha = data.createdAt instanceof Date
    ? data.createdAt
    : new Date(data.createdAt?.seconds * 1000 || Date.now());

  const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();
  li.textContent = `[${fechaStr}] FC: ${data.bpm}, Pot: ${data.power}, RPM: ${data.rpm}, Vel: ${data.speed} km/h, Dist: ${data.distance} km`;
  document.getElementById('session-list').prepend(li);
}

// --- Guardar datos actuales ---
function guardarSesionActual() {
  const now = new Date();
  const sessionData = {
    bpm: parseInt(document.getElementById('hr-display').textContent) || 0,
    power: parseInt(document.getElementById('power').textContent) || 0,
    rpm: parseInt(document.getElementById('rpm').textContent) || 0,
    speed: parseFloat(document.getElementById('gps-speed').textContent) || 0,
    distance: parseFloat(document.getElementById('gps-distance').textContent) || 0,
    createdAt: now
  };

  console.log("Datos a guardar:", sessionData);
  saveSession(sessionData);
  appendSessionToList(sessionData);
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
