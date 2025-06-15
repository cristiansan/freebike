import { setupUI } from './ui.js';
import { connectHR, connectPower, connectRPM, startGPS } from './app.js';
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

setupUI(connectHR, connectPower, connectRPM);
startGPS(); // ⬅️ activa el GPS al iniciar

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

let isRecording = false;
let isPaused = false;
let holdTimeout = null;

const startStopBtn = document.getElementById('startStopBtn');
const startStopLabel = document.getElementById('startStopLabel');
const progressCircle = startStopBtn.querySelector('.hold-progress');

startStopBtn.addEventListener('click', () => {
  if (!isRecording) {
    isRecording = true;
    isPaused = false;
    startStopLabel.innerHTML = "🔴 Grabando sesión...";
    startStopBtn.classList.add("recording");
    startStopBtn.classList.remove("paused");

    const sessionData = {
      bpm: parseInt(document.getElementById('hr-display').textContent),
      power: parseInt(document.getElementById('power').textContent),
      rpm: parseInt(document.getElementById('rpm').textContent),
      speed: parseFloat(document.getElementById('gps-speed').textContent),
      distance: parseFloat(document.getElementById('gps-distance').textContent)
    };

    console.log("Datos a guardar:", sessionData);
    saveSession(sessionData);
  } else if (!isPaused) {
    isPaused = true;
    startStopLabel.innerHTML = "⏸️ HOLD TO STOP";
    startStopBtn.classList.remove("recording");
    startStopBtn.classList.add("paused");
  }
});

// Funciones para manejar el "HOLD TO STOP" con animación
function startHoldToStop() {
  if (isRecording && isPaused) {
    startStopBtn.classList.add('holding');
    holdTimeout = setTimeout(() => {
      isRecording = false;
      isPaused = false;
      startStopLabel.innerHTML = "▶️ Start";
      startStopBtn.classList.remove("recording", "paused", "holding");
      console.log("Sesión detenida.");
    }, 1500);
  }
}

function cancelHoldToStop() {
  clearTimeout(holdTimeout);
  startStopBtn.classList.remove('holding');
}

// Eventos compatibles con mouse y touch
startStopBtn.addEventListener('mousedown', startHoldToStop);
startStopBtn.addEventListener('mouseup', cancelHoldToStop);
startStopBtn.addEventListener('mouseleave', cancelHoldToStop);
startStopBtn.addEventListener('touchstart', startHoldToStop);
startStopBtn.addEventListener('touchend', cancelHoldToStop);
startStopBtn.addEventListener('touchcancel', cancelHoldToStop);
