// ----------------------
// UI Setup
// ----------------------
export function setupUI(connectHR, connectPower, connectRPM) {
  // Botones de conexión
  const hrBtn = document.getElementById("hrConnectBtn");
  const powerBtn = document.getElementById("powerConnectBtn");
  const rpmBtn = document.getElementById("rpmConnectBtn");

  if (hrBtn) hrBtn.addEventListener("click", connectHR);
  if (powerBtn) powerBtn.addEventListener("click", connectPower);
  if (rpmBtn) rpmBtn.addEventListener("click", connectRPM);

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
}

export function updatePower(value) {
  document.getElementById('power').textContent = value ?? '--';
}

export function updateRPM(value) {
  document.getElementById('rpm').textContent = value ?? '--';
}


