// ui.js
export function setupUI(connectHR, connectPower) {
  document.getElementById("hrConnectBtn").addEventListener("click", connectHR);
  document.getElementById("powerConnectBtn").addEventListener("click", connectPower);
}

export function updateHeartRate(value) {
  document.getElementById('hr-display').textContent = value ?? '--';
  document.getElementById('powerConnectBtn').textContent = value ?? '--';
}

