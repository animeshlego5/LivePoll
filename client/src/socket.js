import { io } from 'socket.io-client';

let SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
if (SERVER_URL.endsWith('/')) SERVER_URL = SERVER_URL.slice(0, -1);

const socket = io(SERVER_URL, {
    autoConnect: false,
});

export default socket;
