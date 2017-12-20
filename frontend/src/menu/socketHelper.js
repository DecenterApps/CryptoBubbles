import io from 'socket.io-client';

const socket = io('http://10.241.90.191:60000');


function getSocket() {
    return socket;
}

export default getSocket;