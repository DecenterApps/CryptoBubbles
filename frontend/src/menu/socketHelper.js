import io from 'socket.io-client';

const socket = io('http://localhost:60000');


function getSocket() {
    return socket;
}

export default getSocket;