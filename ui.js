export function setupUI(connectHR, connectPower, connectRPM) {
  document.getElementById("hrConnectBtn").addEventListener("click", connectHR);
  document.getElementById("powerConnectBtn").addEventListener("click", connectPower);
  document.getElementById("rpmConnectBtn").addEventListener("click", connectRPM);

}

export function updateHeartRate(value) {
  document.getElementById('hr-display').textContent = value ?? '--';
}

export function updatePower(value) {
  document.getElementById('power').textContent = value ?? '--';
}

export function updateRPM(value) {
  document.getElementById('rpm').textContent = value ?? '--';
}


// link y version
document.getElementById('version-link').addEventListener('click', () => {
  const changelog = document.getElementById('changelog');
  changelog.style.display = changelog.style.display === 'none' ? 'block' : 'none';
});