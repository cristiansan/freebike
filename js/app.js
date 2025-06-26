import { updateHeartRate, updatePower, updateRPM, updateSpeed } from './ui.js';

// Variables globales para mantener referencias a las conexiones
let hrDevice = null;
let powerDevice = null;
let rpmDevice = null;

// Funciones para guardar y restaurar el estado de conexiones
function saveConnectionState(deviceType, deviceId) {
  const connections = JSON.parse(localStorage.getItem('bluetoothConnections') || '{}');
  connections[deviceType] = deviceId;
  localStorage.setItem('bluetoothConnections', JSON.stringify(connections));
  console.log(`Estado de conexión guardado para ${deviceType}:`, deviceId);
}

function getConnectionState() {
  return JSON.parse(localStorage.getItem('bluetoothConnections') || '{}');
}

function clearConnectionState(deviceType) {
  const connections = JSON.parse(localStorage.getItem('bluetoothConnections') || '{}');
  delete connections[deviceType];
  localStorage.setItem('bluetoothConnections', JSON.stringify(connections));
  console.log(`Estado de conexión limpiado para ${deviceType}`);
}

// Función para restaurar conexiones automáticamente
export async function restoreConnections() {
  const connections = getConnectionState();
  console.log('Intentando restaurar conexiones:', connections);
  
  if (connections.hr) {
    console.log('Restaurando conexión HR...');
    try {
      await connectHRById(connections.hr);
    } catch (error) {
      console.log('No se pudo restaurar conexión HR:', error);
      clearConnectionState('hr');
    }
  }
  
  if (connections.power) {
    console.log('Restaurando conexión Power...');
    try {
      await connectPowerById(connections.power);
    } catch (error) {
      console.log('No se pudo restaurar conexión Power:', error);
      clearConnectionState('power');
    }
  }
  
  if (connections.rpm) {
    console.log('Restaurando conexión RPM...');
    try {
      await connectRPMById(connections.rpm);
    } catch (error) {
      console.log('No se pudo restaurar conexión RPM:', error);
      clearConnectionState('rpm');
    }
  }
}

// Funciones para conectar por ID (sin diálogo de selección)
async function connectHRById(deviceId) {
  try {
    console.log("Conectando a HR por ID:", deviceId);
    
    // Intentar conectar directamente al dispositivo
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
      optionalServices: ['heart_rate']
    });
    
    // Verificar que sea el dispositivo correcto
    if (device.id !== deviceId) {
      throw new Error('Dispositivo incorrecto');
    }
    
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const bpm = parseHeartRate(event.target.value);
      updateHeartRate(bpm);
    });

    hrDevice = device;
    saveConnectionState('hr', device.id);
    
    document.getElementById("hrConnectBtn").classList.add("connected");
    console.log('HR reconectado exitosamente');
    
    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo HR desconectado');
      document.getElementById("hrConnectBtn").classList.remove("connected");
      hrDevice = null;
      clearConnectionState('hr');
    });
    
  } catch (error) {
    console.error('Error reconectando HR:', error);
    throw error;
  }
}

async function connectPowerById(deviceId) {
  try {
    console.log("Conectando a Power por ID:", deviceId);
    
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['cycling_power'] }],
      optionalServices: ['cycling_power']
    });
    
    if (device.id !== deviceId) {
      throw new Error('Dispositivo incorrecto');
    }
    
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('cycling_power');
    const characteristic = await service.getCharacteristic('cycling_power_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = parsePower(event.target.value);
      updatePower(value);
    });

    powerDevice = device;
    saveConnectionState('power', device.id);

    document.getElementById("powerConnectBtn").classList.add("connected");
    console.log('Power reconectado exitosamente');

    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo Power desconectado');
      document.getElementById("powerConnectBtn").classList.remove("connected");
      powerDevice = null;
      clearConnectionState('power');
    });

  } catch (error) {
    console.error('Error reconectando Power:', error);
    throw error;
  }
}

async function connectRPMById(deviceId) {
  try {
    console.log("Conectando a RPM por ID:", deviceId);
    
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['cycling_speed_and_cadence'] }],
      optionalServices: ['cycling_speed_and_cadence']
    });
    
    if (device.id !== deviceId) {
      throw new Error('Dispositivo incorrecto');
    }
    
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('cycling_speed_and_cadence');
    const characteristic = await service.getCharacteristic('csc_measurement');

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const rpm = parseRPM(event.target.value);
      if (rpm !== null) updateRPM(rpm);
    });

    rpmDevice = device;
    saveConnectionState('rpm', device.id);

    document.getElementById("rpmConnectBtn").classList.add("connected");
    console.log('RPM reconectado exitosamente');

    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo RPM desconectado');
      document.getElementById("rpmConnectBtn").classList.remove("connected");
      rpmDevice = null;
      clearConnectionState('rpm');
    });

  } catch (error) {
    console.error('Error reconectando RPM:', error);
    throw error;
  }
}

function parseHeartRate(dataView) {
  const flags = dataView.getUint8(0);
  const rate16Bits = flags & 0x01;
  return rate16Bits ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

function parsePower(dataView) {
  // Bytes 2-3: Potencia instantánea (uint16)
  return dataView.getUint16(2, true);
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

let lastPosition = null;

export function resetGPSData() {
    lastPosition = null;
    totalDistance = 0;
    console.log("🔄 GPS data reseteado");
}

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

let totalDistance = 0;

export function startGPS() {
  if (!navigator.geolocation) {
    console.error("GPS no disponible");
    return;
  }

  console.log("🛰️ Iniciando GPS...");

  navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      const accuracy = coords.accuracy;
      
      console.log(`📍 GPS - Lat: ${coords.latitude.toFixed(6)}, Lon: ${coords.longitude.toFixed(6)}, Precisión: ${accuracy}m`);

      const current = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: position.timestamp,
        accuracy: accuracy
      };

      if (lastPosition) {
        const deltaT = (current.timestamp - lastPosition.timestamp) / 1000;
        const deltaD = haversineDistance(lastPosition, current);
        
        console.log(`📏 ΔT: ${deltaT.toFixed(1)}s, ΔD: ${deltaD.toFixed(1)}m, Precisión: ${accuracy}m`);

        // Filtros mejorados para GPS más preciso
        if (deltaT > 0.5 && // Mínimo 0.5 segundos entre actualizaciones
            deltaT < 60 &&  // Máximo 60 segundos (evitar saltos de tiempo)
            deltaD < 200 && // Máximo 200m por actualización (ciclismo rápido ~70km/h)
            deltaD > 0.5 && // Mínimo 0.5m (evitar ruido GPS)
            accuracy < 50) { // Solo usar lecturas GPS con buena precisión (<50m)
          
          const speed_ms = deltaD / deltaT; // m/s
          const speed_kmh = speed_ms * 3.6; // km/h
          
          console.log(`✅ GPS válido - Velocidad: ${speed_kmh.toFixed(1)} km/h, Distancia: +${deltaD.toFixed(1)}m`);
          
          // Actualizar distancia total solo si estamos grabando
          if (window.isRecording && !window.isPaused) {
            totalDistance += deltaD / 1000; // Acumular en km
            
            // Actualizar en sessionStats si existe
            if (window.sessionStats) {
              window.sessionStats.distance = totalDistance;
            }
            
            const distanceElement = document.getElementById('gps-distance');
            if (distanceElement) {
              distanceElement.textContent = totalDistance.toFixed(2) + ' km';
            }
            
            console.log(`📊 Distancia total: ${totalDistance.toFixed(3)} km`);
          }
          
          // Enviar velocidad al agregador de UI para promediar y mostrar (siempre)
          if (speed_ms !== null && isFinite(speed_ms) && speed_ms > 0) {
            updateSpeed(speed_ms);
          }
        } else {
          console.log(`❌ GPS filtrado - ΔT: ${deltaT.toFixed(1)}s, ΔD: ${deltaD.toFixed(1)}m, Precisión: ${accuracy}m`);
        }
      } else {
        console.log("🎯 Primera posición GPS establecida");
      }

      lastPosition = current;
    },
    (err) => {
      console.error("❌ Error GPS:", err);
      console.error("Código de error:", err.code, "Mensaje:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 2000, // Aumentar a 2 segundos para mejor precisión
      timeout: 10000,   // Aumentar timeout a 10 segundos
    }
  );
}

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

    // Guardar referencia al dispositivo y estado de conexión
    hrDevice = device;
    saveConnectionState('hr', device.id);
    
    // ✅ Una vez conectado y notificando, marcamos el botón como "conectado"
    document.getElementById("hrConnectBtn").classList.add("connected");
    console.log('Conectado a la banda HR');
    
    // Manejar desconexión
    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo HR desconectado');
      document.getElementById("hrConnectBtn").classList.remove("connected");
      hrDevice = null;
      clearConnectionState('hr');
    });
    
  } catch (error) {
    console.error('Error conectando HR:', error);
    clearConnectionState('hr');
  }
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

    // Guardar referencia al dispositivo y estado de conexión
    powerDevice = device;
    saveConnectionState('power', device.id);

    // ✅ Una vez conectado y notificando, marcamos el botón como "conectado"
    document.getElementById("powerConnectBtn").classList.add("connected");
    console.log('Sensor de potencia conectado');

    // Manejar desconexión
    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo Power desconectado');
      document.getElementById("powerConnectBtn").classList.remove("connected");
      powerDevice = null;
      clearConnectionState('power');
    });

  } catch (err) {
    console.error('Error conectando Potencia:', err);
    clearConnectionState('power');
  }
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

    // Guardar referencia al dispositivo y estado de conexión
    rpmDevice = device;
    saveConnectionState('rpm', device.id);

    document.getElementById("rpmConnectBtn").classList.add("connected");
    console.log('Sensor de cadencia conectado');

    // Manejar desconexión
    device.addEventListener('gattserverdisconnected', () => {
      console.log('Dispositivo RPM desconectado');
      document.getElementById("rpmConnectBtn").classList.remove("connected");
      rpmDevice = null;
      clearConnectionState('rpm');
    });

  } catch (err) {
    console.error('Error conectando Cadencia:', err);
    clearConnectionState('rpm');
  }
}

