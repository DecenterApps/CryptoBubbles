const io = require('socket.io-client');

const socket = io('http://localhost:60000');

module.exports = {
    socket,
};