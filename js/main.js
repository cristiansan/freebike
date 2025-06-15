import { setupUI } from './ui.js';
import { connectHR, connectPower, connectRPM, startGPS } from './app.js';

setupUI(connectHR, connectPower, connectRPM);
startGPS(); // ⬅️ activa el GPS al iniciar

