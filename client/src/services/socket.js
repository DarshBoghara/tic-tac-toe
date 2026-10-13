/**
 * Socket.IO client service.
 * Single shared socket instance across the app.
 */
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

let socket = null;

/**
 * Get (or create) the singleton socket connection.
 * We use manual connection management to avoid connecting before needed.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/**
 * Connect the socket if not already connected.
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

/**
 * Emit a socket event with a promise-based acknowledgement.
 * @param {string} event
 * @param {object} payload
 * @param {number} timeout - ms before rejection
 * @returns {Promise<object>}
 */
export function emitWithAck(event, payload, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s.connected) {
      reject(new Error('Not connected to server.'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, timeout);

    s.emit(event, payload, (response) => {
      clearTimeout(timer);
      if (response?.success === false) {
        reject(new Error(response.error || 'Unknown server error.'));
      } else {
        resolve(response);
      }
    });
  });
}
