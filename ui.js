export function setupUI(connectHR, connectPower) {
  document.getElementById("hrConnectBtn").addEventListener("click", connectHR);
  document.getElementById("powerConnectBtn").addEventListener("click", connectPower);
}

export function updateHeartRate(value) {
  document.getElementById('hr-display').textContent = value ?? '--';
}

export function updatePower(value) {
  document.getElementById('power').textContent = value ?? '--';
}

