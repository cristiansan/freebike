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
// link y version
document.getElementById('version-link').addEventListener('click', () => {
  const changelog = document.getElementById('changelog');
  changelog.style.display = changelog.style.display === 'none' ? 'block' : 'none';
});

// export function updateHeartRate(value) {
//   const display = document.getElementById('hr-display');
//   display.textContent = value ?? '--';

//   // Animación de pulso
//   display.classList.remove('pulse'); // reinicia si ya está
//   void display.offsetWidth;          // fuerza reflow para reiniciar la animación
//   display.classList.add('pulse');
// }
