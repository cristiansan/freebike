// ----------------------
// UI Setup
// ----------------------
let isRunning = false; // Esto debe estar fuera de la función

export function setupUI(connectHR, connectPower, connectRPM) {
  // Botones de conexión
  const hrBtn = document.getElementById("hrConnectBtn");
  const powerBtn = document.getElementById("powerConnectBtn");
  const rpmBtn = document.getElementById("rpmConnectBtn");
  const speedBtn = document.getElementById("speedModeBtn");
  const speedIcon = document.getElementById("speedModeIcon");

  if (hrBtn) hrBtn.addEventListener("click", connectHR);
  if (powerBtn) powerBtn.addEventListener("click", connectPower);
  if (rpmBtn) rpmBtn.addEventListener("click", connectRPM);

  // Botón para cambiar entre modo bici / correr
  if (speedBtn && speedIcon) {
    speedBtn.addEventListener("click", () => {
      isRunning = !isRunning;
      speedIcon.src = isRunning ? "icons/run.svg" : "icons/bike.svg";
      speedIcon.alt = isRunning ? "Modo Correr" : "Modo Bicicleta";

      // Actualizar formato si ya hay valor mostrado
      const speedElem = document.getElementById("speed");
      if (speedElem.dataset.rawSpeed) {
        updateSpeed(parseFloat(speedElem.dataset.rawSpeed));
      }
    });
  }

  // Versión y changelog toggle
  const versionLink = document.getElementById('version-link');
  const changelog = document.getElementById('changelog');

  if (versionLink && changelog) {
    versionLink.addEventListener('click', () => {
      changelog.style.display = changelog.style.display === 'none' ? 'block' : 'none';
    });
  }
}


// ----------------------
// Actualizaciones UI
// ----------------------
export function updateHeartRate(value) {
  document.getElementById('hr-display').textContent = value ?? '--';
  // Actualizar estadísticas de la sesión si existe la función
  if (window.updateSessionStats) {
    window.updateSessionStats('bpm', value);
  }
}

export function updatePower(value) {
  document.getElementById('power').textContent = value ?? '--';
  // Actualizar estadísticas de la sesión si existe la función
  if (window.updateSessionStats) {
    window.updateSessionStats('power', value);
  }
}

export function updateRPM(value) {
  document.getElementById('rpm').textContent = value ?? '--';
  // Actualizar estadísticas de la sesión si existe la función
  if (window.updateSessionStats) {
    window.updateSessionStats('rpm', value);
  }
}

export function updateSpeed(mps) {
  const elem = document.getElementById("speed");
  if (!elem) return;

  elem.dataset.rawSpeed = mps;

  if (isRunning) {
    if (mps > 0) {
      const pace = 1000 / (mps * 60);
      const min = Math.floor(pace);
      const sec = Math.round((pace - min) * 60).toString().padStart(2, '0');
      elem.textContent = `${min}:${sec} /km`;
    } else {
      elem.textContent = "--";
    }
  } else {
    elem.textContent = `${(mps * 3.6).toFixed(1)} km/h`;
  }
  
  // Actualizar estadísticas de la sesión si existe la función
  if (window.updateSessionStats) {
    window.updateSessionStats('speed', mps * 3.6); // Convertir a km/h
  }
}





