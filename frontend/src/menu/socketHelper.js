import io from 'socket.io-client';

const socket = io('http://localhost:60000');

export default getSocket => socket;