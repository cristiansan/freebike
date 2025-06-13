export function setupUI(connectCallback) {
  const connectBtn = document.getElementById('connect-btn');
  connectBtn.addEventListener('click', connectCallback);
}

export function updateHeartRate(value) {
  document.getElementById('hr-display').textContent = value ?? '--';
}
