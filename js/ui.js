// ----------------------
// UI Setup
// ----------------------
let isRunning = false; // Esto debe estar fuera de la función

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

  if (hrBtn) hrBtn.addEventListener("click", connectHR);
  if (powerBtn) powerBtn.addEventListener("click", connectPower);
  if (rpmBtn) rpmBtn.addEventListener("click", connectRPM);

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
  const elem = document.getElementById("gps-speed");
  if (!elem) return;

  elem.dataset.rawSpeed = mps;

  if (isRunning) {
    if (mps > 0) {
      const pace = 1000 / (mps * 60);
      const min = Math.floor(pace);
      const sec = Math.round((pace - min) * 60).toString().padStart(2, '0');
      elem.textContent = `${min}:${sec}`;
    } else {
      elem.textContent = "--";
    }
  } else {
    elem.textContent = `${(mps * 3.6).toFixed(1)}`;
  }
  
  // Actualizar estadísticas de la sesión si existe la función
  if (window.updateSessionStats) {
    window.updateSessionStats('speed', mps * 3.6); // Convertir a km/h
  }
}





