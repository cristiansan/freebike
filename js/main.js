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

const startStopBtn = document.getElementById('startStopBtn');
const startStopLabel = document.getElementById('startStopLabel');

// Guarda sesión en Firestore
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

// Añade la sesión al historial visible
function appendSessionToList(data) {
  const li = document.createElement('li');

  const fecha = data.createdAt instanceof Date
    ? data.createdAt
    : new Date(data.createdAt?.seconds * 1000 || Date.now());

  const fechaStr = fecha.toLocaleDateString() + ' ' + fecha.toLocaleTimeString();

  li.textContent = `[${fechaStr}] FC: ${data.bpm}, Pot: ${data.power}, RPM: ${data.rpm}, Vel: ${data.speed} km/h, Dist: ${data.distance} km`;

  document.getElementById('session-list').prepend(li);
}

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

function handleClick() {
  if (holdTriggered) {
    // Ignorar clicks tras hold para evitar estados extraños
    return;
  }
  
  if (!isRecording) {
    // Iniciar grabación
    isRecording = true;
    isPaused = false;
    guardarSesionActual();
  } else if (!isPaused) {
    // Pausar grabación
    isPaused = true;
  } else {
    // Reanudar grabación
    isPaused = false;
  }
  updateButtonUI();
}

// Hold largo para detener la sesión grabada
function startHoldToStop() {
  if (isRecording && isPaused) {
    holdTriggered = false;
    startStopBtn.classList.add('holding');
    holdTimeout = setTimeout(() => {
      holdTriggered = true;
      isRecording = false;
      isPaused = false;
      updateButtonUI();
      console.log("Sesión detenida.");
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

startStopBtn.addEventListener('click', handleClick);
startStopBtn.addEventListener('mousedown', startHoldToStop);
startStopBtn.addEventListener('mouseup', () => {
  cancelHoldToStop();
});
startStopBtn.addEventListener('mouseleave', cancelHoldToStop);
startStopBtn.addEventListener('touchstart', startHoldToStop);
startStopBtn.addEventListener('touchend', () => {
  cancelHoldToStop();
});
startStopBtn.addEventListener('touchcancel', cancelHoldToStop);
