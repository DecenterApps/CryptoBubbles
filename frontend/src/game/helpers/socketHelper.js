const io = require('socket.io-client');

const socket = io('http://10.241.90.191:60000');

module.exports = {
    socket,
};