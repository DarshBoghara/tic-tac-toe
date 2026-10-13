/**
 * Socket.IO client service.
 * Single shared socket instance across the app.
 */
import { io } from 'socket.io-client';

// Production Render server fallback
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || 'https://tic-tac-toe-z1rf.onrender.com';

console.log('[socket] connecting to:', SERVER_URL);

/**
 * Get (or create) the singleton socket connection.
 */
export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
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
 * Waits for connection if currently connecting.
 */
export function emitWithAck(event, payload, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const s = connectSocket();

    const send = () => {
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
    };

    if (s.connected) {
      send();
    } else {
      // If not yet connected, wait for connect event
      const onConnect = () => {
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        clearTimeout(waitTimer);
        send();
      };
      const onError = (err) => {
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        clearTimeout(waitTimer);
        reject(new Error('Could not connect to server. Render may be waking up, please wait a moment.'));
      };
      const waitTimer = setTimeout(() => {
        s.off('connect', onConnect);
        s.off('connect_error', onError);
        reject(new Error('Connection timed out. Render may be waking up, please retry in 10 seconds.'));
      }, 10000);

      s.once('connect', onConnect);
      s.once('connect_error', onError);
    }
  });
}
