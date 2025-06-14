import { updateHeartRate, updatePower } from './ui.js';

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
    await characteristic.startNotifications();
    document.getElementById("hrConnectBtn").classList.add("connected");
    console.log('Conectado a la banda HR');
  } catch (error) {
    console.error('Error conectando HR:', error);
  }
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
      filters: [{ services: ['cycling_rpm'] }]
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('cycling_rpm');
    const characteristic = await service.getCharacteristic('cycling_rpm_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = parseRPM(event.target.value);
      updateRPM(value);
    });

    // ✅ Una vez conectado y notificando, marcamos el botón como "conectado"
    document.getElementById("rpmConnectBtn").classList.add("connected");
    console.log('Sensor de cadencia conectado');

  } catch (err) {
    console.error('Error conectando Cadencia:', err);
  }
}

function parseRPM(dataView) {
  // Bytes 2-3: Cadencia instantánea (uint16)
  return dataView.getUint16(2, true);
}