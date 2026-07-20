// config.js
import { Platform } from 'react-native';

// Reemplaza con la IP local de tu computadora en tu red Wi-Fi
const LOCAL_IP = '192.168.100.52'; 
const PORT = '5050'; // El puerto donde corre tu servidor Node.js

export const API_URL = Platform.select({
  ios: `http://${LOCAL_IP}:${PORT}`,
  android: `http://${LOCAL_IP}:${PORT}`,
  default: `http://localhost:${PORT}`,
});