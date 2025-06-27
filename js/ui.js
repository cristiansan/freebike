import { calculateSpeedFromPower, calculateSpeedFromCadence, isIndoorMode } from './physics.js';

// ----------------------
// UI Setup
// ----------------------
let isRunning = false; // Esto debe estar fuera de la función

// --- Throttling y promediado de datos ---
const UPDATE_INTERVAL_MS = 3000; // 3 segundos

const dataAggregator = {
    bpm: { buffer: [] },
    power: { buffer: [] },
    rpm: { buffer: [] },
    speed: { buffer: [] },
};
let updateTimer = null;

function flushAllBuffers() {
    const avg = {};
    for (const type in dataAggregator) {
        const aggregator = dataAggregator[type];
        if (aggregator.buffer.length > 0) {
            avg[type] = Math.round(aggregator.buffer.reduce((a, b) => a + b, 0) / aggregator.buffer.length);
            aggregator.buffer = [];
        }
    }

    if (Object.keys(avg).length === 0) {
        updateTimer = null;
        return;
    }

    // Detectar modo rodillo al principio
    const indoorMode = isIndoorMode();
    
    // Actualizar UI para sensores (HR, Power, RPM) siempre que haya datos
    if (avg.bpm !== undefined) document.getElementById('hr-display').textContent = avg.bpm;
    if (avg.power !== undefined) {
        document.getElementById('power').textContent = avg.power;
        console.log(`⚡ Potencia recibida: ${avg.power}W`);
        updateWattsPerHour(avg.power); // Actualizar watts/h
    } 
    // En modo rodillo sin potenciómetro, estimar potencia desde cadencia
    else if (indoorMode && avg.rpm !== undefined && avg.rpm > 30) {
        const estimatedPower = Math.round(avg.rpm * 2.5); // Estimación simple: ~2.5W por RPM
        console.log(`🔄 Potencia estimada desde cadencia: ${estimatedPower}W`);
        updateWattsPerHour(estimatedPower);
    }
    if (avg.rpm !== undefined) document.getElementById('rpm').textContent = avg.rpm;

    // --- Lógica de cálculo de velocidad ---
    let finalSpeed_ms = (avg.speed !== undefined) ? avg.speed : 0;
    
    if (indoorMode || finalSpeed_ms < 0.5) {
        console.log(`🏠 Modo rodillo detectado: ${indoorMode}`);
        
        // Prioridad 1: Calcular desde potencia si está disponible
        if (avg.power !== undefined && avg.power > 10) {
            finalSpeed_ms = calculateSpeedFromPower(avg.power);
            console.log(`⚡ Velocidad desde potencia: ${(finalSpeed_ms * 3.6).toFixed(1)} km/h`);
        }
        // Prioridad 2: Calcular desde cadencia si no hay potencia
        else if (avg.rpm !== undefined && avg.rpm > 30) {
            finalSpeed_ms = calculateSpeedFromCadence(avg.rpm);
            console.log(`🔄 Velocidad desde cadencia: ${(finalSpeed_ms * 3.6).toFixed(1)} km/h`);
        }
        
        // Calcular distancia virtual en modo rodillo
        if (finalSpeed_ms > 0 && window.isRecording && !window.isPaused) {
            updateVirtualDistance(finalSpeed_ms);
        }
    }

    // Actualizar la UI de velocidad siempre
    updateSpeedDisplay(finalSpeed_ms);

    // --- Guardar estadísticas solo si se está grabando ---
    if (window.isRecording && !window.isPaused) {
        if (avg.bpm !== undefined) window.updateSessionStats('bpm', avg.bpm);
        if (avg.power !== undefined) window.updateSessionStats('power', avg.power);
        if (avg.rpm !== undefined) window.updateSessionStats('rpm', avg.rpm);
        
        // Siempre guardar la velocidad final (sea de GPS o calculada)
        window.updateSessionStats('speed', finalSpeed_ms * 3.6);
    }

    updateTimer = null; // Liberar el temporizador para el próximo ciclo
}

function aggregateAndSchedule(type, value) {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return;
    
    dataAggregator[type].buffer.push(value);

    if (!updateTimer) {
        updateTimer = setTimeout(flushAllBuffers, UPDATE_INTERVAL_MS);
    }
}

function updateSpeedDisplay(speedInMps) {
    const elem = document.getElementById("gps-speed");
    if (!elem) return;

    if (isRunning) { // Modo Correr (Pace)
        if (speedInMps > 0.1) {
            const pace = 1000 / (speedInMps * 60);
            const min = Math.floor(pace);
            const sec = Math.round((pace - min) * 60).toString().padStart(2, '0');
            elem.textContent = `${min}:${sec}`;
        } else {
            elem.textContent = "--";
        }
    } else { // Modo Bici (Km/h)
        elem.textContent = (speedInMps * 3.6).toFixed(1);
    }
}

function setupThemeSwitcher() {
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  const body = document.body;

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      if(themeToggle) themeToggle.checked = true;
    } else {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      if(themeToggle) themeToggle.checked = false;
    }
  };

  const savedTheme = localStorage.getItem('theme') || 'dark'; // dark by default
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('change', () => {
      const newTheme = themeToggle.checked ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }
}

export function setupUI(connectHR, connectPower, connectRPM) {
  // Setup theme
  setupThemeSwitcher();

  // Botones de conexión
  const hrBtn = document.getElementById("hrConnectBtn");
  const powerBtn = document.getElementById("powerConnectBtn");
  const rpmBtn = document.getElementById("rpmConnectBtn");
  const speedBtn = document.getElementById("speedModeBtn");
  const speedIcon = document.getElementById("speedModeIcon");
  const speedTitle = document.getElementById("speed-title");
  
  // Nuevos botones
  const wattsHourBtn = document.getElementById("wattsHourBtn");
  const sensorSpeedBtn = document.getElementById("sensorSpeedBtn");

  if (hrBtn) hrBtn.addEventListener("click", connectHR);
  if (powerBtn) powerBtn.addEventListener("click", connectPower);
  if (rpmBtn) rpmBtn.addEventListener("click", connectRPM);
  if (wattsHourBtn) wattsHourBtn.addEventListener("click", resetWattsPerHour);
  if (sensorSpeedBtn) sensorSpeedBtn.addEventListener("click", toggleSensorSpeed);

  // Botón para cambiar entre modo bici / correr
  if (speedBtn && speedIcon && speedTitle) {
    speedBtn.addEventListener("click", () => {
      isRunning = !isRunning;
      speedIcon.src = isRunning ? "icons/run.svg" : "icons/bike.svg";
      speedIcon.alt = isRunning ? "Running Mode" : "Bike Mode";
      speedTitle.textContent = isRunning ? "min/km" : "Km/h";

      // Actualizar formato si ya hay valor mostrado
      const speedElem = document.getElementById("gps-speed");
      if (speedElem && speedElem.dataset.rawSpeed) {
        updateSpeed(parseFloat(speedElem.dataset.rawSpeed));
      }
    });
  }

  // Changelog Modal Logic
  const versionLink = document.getElementById('version-link');
  const changelogModal = document.getElementById('changelog-modal');
  const closeModalBtn = document.querySelector('.modal-close-btn');

  if (versionLink && changelogModal && closeModalBtn) {
    versionLink.addEventListener('click', (e) => {
      e.preventDefault(); // Evitar que el enlace navegue
      changelogModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
      changelogModal.style.display = 'none';
    });

    // Opcional: Cerrar si se hace clic fuera del modal
    window.addEventListener('click', (e) => {
      if (e.target === changelogModal) {
        changelogModal.style.display = 'none';
      }
    });
  }
}

// ----------------------
// Actualizaciones UI
// ----------------------
export function updateHeartRate(value) {
  aggregateAndSchedule('bpm', value);
}

export function updatePower(value) {
  aggregateAndSchedule('power', value);
}

export function updateRPM(value) {
  aggregateAndSchedule('rpm', value);
}

export function updateSpeed(mps) {
  aggregateAndSchedule('speed', mps);
}

// Variables para watts/h y velocidad del sensor
let wattsPerHourTotal = 0;
let wattsPerHourStartTime = null;
let sensorSpeedEnabled = false;
let lastMotionTime = 0;

// Variables para modo rodillo (indoor)
let lastVirtualSpeedUpdate = 0;
let virtualDistance = 0;

export function updateWattsPerHour(powerValue) {
  if (!window.isRecording || window.isPaused || !powerValue || powerValue <= 0) {
    console.log(`🔋 Watts/h no actualizado - Recording: ${window.isRecording}, Paused: ${window.isPaused}, Power: ${powerValue}`);
    return;
  }
  
  if (!wattsPerHourStartTime) {
    wattsPerHourStartTime = Date.now();
    wattsPerHourTotal = 0; // Resetear al inicio
    console.log(`🔋 Watts/h iniciado con ${powerValue}W`);
    return; // No calcular en la primera llamada
  }
  
  const now = Date.now();
  const timeElapsedSeconds = (now - wattsPerHourStartTime) / 1000;
  
  // Calcular energía acumulada: Watts × tiempo en horas = Watt-hora
  const timeElapsedHours = timeElapsedSeconds / 3600;
  const energyIncrement = powerValue * (timeElapsedHours);
  
  // Acumular energía total
  if (timeElapsedHours > 0) {
    wattsPerHourTotal += energyIncrement;
    document.getElementById('watts-per-hour').textContent = Math.round(wattsPerHourTotal);
    
    console.log(`🔋 Watts/h actualizado: +${energyIncrement.toFixed(2)}Wh, Total: ${wattsPerHourTotal.toFixed(2)}Wh`);
    
    // Actualizar el tiempo de referencia para el próximo cálculo
    wattsPerHourStartTime = now;
    
    // Guardar estadística
    if (window.updateSessionStats) {
      window.updateSessionStats('wattsPerHour', wattsPerHourTotal);
    }
  }
}

export function resetWattsPerHour() {
  wattsPerHourTotal = 0;
  wattsPerHourStartTime = null;
  document.getElementById('watts-per-hour').textContent = '--';
}

export function updateSensorSpeed(speed) {
  if (sensorSpeedEnabled) {
    document.getElementById('sensor-speed').textContent = speed.toFixed(1);
    
    // Guardar estadística si estamos grabando
    if (window.isRecording && !window.isPaused && window.updateSessionStats) {
      window.updateSessionStats('sensorSpeed', speed);
    }
  }
}

function initSensorSpeed() {
  if ('DeviceMotionEvent' in window) {
    window.addEventListener('devicemotion', (event) => {
      if (!sensorSpeedEnabled) return;
      
      const acceleration = event.acceleration;
      if (acceleration && acceleration.x !== null) {
        const now = Date.now();
        if (now - lastMotionTime > 500) { // Actualizar cada 500ms
          // Calcular velocidad basada en aceleración (aproximación)
          const totalAcceleration = Math.sqrt(
            acceleration.x * acceleration.x + 
            acceleration.y * acceleration.y + 
            acceleration.z * acceleration.z
          );
          
          // Convertir a velocidad aproximada (esto es una estimación)
          const estimatedSpeed = Math.max(0, (totalAcceleration - 9.8) * 3.6); // km/h
          updateSensorSpeed(estimatedSpeed);
          lastMotionTime = now;
        }
      }
    });
  }
}

function toggleSensorSpeed() {
  sensorSpeedEnabled = !sensorSpeedEnabled;
  const btn = document.getElementById('sensorSpeedBtn');
  
  if (sensorSpeedEnabled) {
    btn.classList.add('connected');
    // Solicitar permisos si es necesario
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            initSensorSpeed();
          } else {
            sensorSpeedEnabled = false;
            btn.classList.remove('connected');
            alert('Permisos de sensor de movimiento necesarios');
          }
        });
    } else {
      initSensorSpeed();
    }
  } else {
    btn.classList.remove('connected');
    document.getElementById('sensor-speed').textContent = '--';
  }
}

// Función para actualizar distancia virtual en modo rodillo
function updateVirtualDistance(speedMs) {
  const now = Date.now();
  
  if (lastVirtualSpeedUpdate > 0) {
    const deltaTime = (now - lastVirtualSpeedUpdate) / 1000; // segundos
    const deltaDistance = speedMs * deltaTime; // metros
    
    virtualDistance += deltaDistance / 1000; // convertir a km
    
    // Actualizar UI y sessionStats
    if (window.sessionStats) {
      window.sessionStats.distance = virtualDistance;
    }
    
    const distanceElement = document.getElementById('gps-distance');
    if (distanceElement) {
      distanceElement.textContent = virtualDistance.toFixed(2) + ' km';
    }
    
    console.log(`🚴 Distancia virtual: +${(deltaDistance).toFixed(1)}m, Total: ${virtualDistance.toFixed(3)}km`);
  }
  
  lastVirtualSpeedUpdate = now;
}

// Función para resetear distancia virtual
export function resetVirtualDistance() {
  virtualDistance = 0;
  lastVirtualSpeedUpdate = 0;
  console.log("🔄 Distancia virtual reseteada");
}





