import { updateHeartRate, updatePower, updateRPM } from './ui.js';

//Conector HR---------------------------------------------
export async function connectHR() {
  try {
    console.log("Buscando sensor de HR...");

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const bpm = parseHeartRate(event.target.value);
      updateHeartRate(bpm);
    });
// ✅ Una vez conectado y notificando, marcamos el botón como "conectado"
    // await characteristic.startNotifications();
    document.getElementById("hrConnectBtn").classList.add("connected");
    console.log('Conectado a la banda HR');
  } catch (error) {
    console.error('Error conectando HR:', error);
  }
  // Al final de connectHR(), justo después de marcar botón conectado y mostrar consola
window.holdTriggered = false;

const startStopBtn = document.getElementById('startStopBtn');
holdTriggered = false;
startStopBtn.classList.remove('holding', 'paused', 'recording');
isRecording = false;
isPaused = false;
updateButtonUI();


}

function parseHeartRate(dataView) {
  const flags = dataView.getUint8(0);
  const rate16Bits = flags & 0x01;
  return rate16Bits ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

//Conector Potencia---------------------------------------------
export async function connectPower() {
  try {
    console.log("Buscando sensor de potencia...");

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['cycling_power'] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('cycling_power');
    const characteristic = await service.getCharacteristic('cycling_power_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = parsePower(event.target.value);
      updatePower(value);
    });

    // ✅ Una vez conectado y notificando, marcamos el botón como "conectado"
    document.getElementById("powerConnectBtn").classList.add("connected");
    console.log('Sensor de potencia conectado');

  } catch (err) {
    console.error('Error conectando Potencia:', err);
  }
}

function parsePower(dataView) {
  // Bytes 2-3: Potencia instantánea (uint16)
  return dataView.getUint16(2, true);
}

//Conector Cadencia---------------------------------------------
export async function connectRPM() {
  try {
    console.log("Buscando sensor de cadencia...");

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['cycling_speed_and_cadence'] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('cycling_speed_and_cadence');
    const characteristic = await service.getCharacteristic('csc_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const rpm = parseRPM(event.target.value);
      if (rpm !== null) updateRPM(rpm);
    });

    document.getElementById("rpmConnectBtn").classList.add("connected");
    console.log('Sensor de cadencia conectado');

  } catch (err) {
    console.error('Error conectando Cadencia:', err);
  }
}

let lastCrankRevolutions = null;
let lastCrankEventTime = null;

function parseRPM(dataView) {
  const flags = dataView.getUint8(0);
  const crankDataPresent = (flags & 0x02) !== 0;

  if (!crankDataPresent) return null;

  let index = 1;

  // Saltar datos de rueda si están presentes
  if (flags & 0x01) index += 6;

  const crankRevolutions = dataView.getUint16(index, true);
  const crankEventTime = dataView.getUint16(index + 2, true); // en 1/1024 seg

  if (lastCrankRevolutions !== null && lastCrankEventTime !== null) {
    let deltaRevs = crankRevolutions - lastCrankRevolutions;
    let deltaTime = crankEventTime - lastCrankEventTime;

    // Controlar overflow del contador (16 bits)
    if (deltaTime < 0) deltaTime += 65536;

    const deltaSeconds = deltaTime / 1024;

    if (deltaSeconds > 0 && deltaRevs >= 0) {
      const rpm = (deltaRevs / deltaSeconds) * 60;
       if (rpm > 300) {
        console.warn(`RPM fuera de rango: ${rpm.toFixed(1)}`);
        return null;
      }
      lastCrankRevolutions = crankRevolutions;
      lastCrankEventTime = crankEventTime;
      console.log(`Crank deltaRevs: ${deltaRevs}, deltaTime: ${deltaSeconds.toFixed(2)}s, RPM: ${rpm.toFixed(1)}`);

      return Math.round(rpm);
    }
  }

  lastCrankRevolutions = crankRevolutions;
  lastCrankEventTime = crankEventTime;
  return null;
}
//Conector GPS---------------------------------------------
let lastPosition = null;
let totalDistance = 0;

function toRad(deg) {
  return deg * Math.PI / 180;
}

function haversineDistance(pos1, pos2) {
  const R = 6371000; // radio Tierra en metros
  const dLat = toRad(pos2.latitude - pos1.latitude);
  const dLon = toRad(pos2.longitude - pos1.longitude);

  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(pos1.latitude)) *
            Math.cos(toRad(pos2.latitude)) *
            Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function startGPS() {
  if (!navigator.geolocation) {
    console.error("GPS no disponible");
    return;
  }

  navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      const current = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: position.timestamp,
      };

      if (lastPosition) {
        const deltaT = (current.timestamp - lastPosition.timestamp) / 1000;
        const deltaD = haversineDistance(lastPosition, current);

        if (deltaT > 0 && deltaD < 100) {
          const speed = deltaD / deltaT; // m/s
          totalDistance += deltaD;

          const speedElement = document.getElementById('gps-speed');
          const distanceElement = document.getElementById('gps-distance');

          if (speedElement) speedElement.textContent = (speed * 3.6).toFixed(1) + ' km/h';
          if (distanceElement) distanceElement.textContent = (totalDistance / 1000).toFixed(2) + ' km';
        }
      }

      lastPosition = current;
    },
    (err) => console.error("Error GPS:", err),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    }
  );
}
