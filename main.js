import { setupUI } from './ui.js';
import { connectHR, connectPower, connectRPM } from './app.js';

setupUI(connectHR, connectPower, connectRPM);
