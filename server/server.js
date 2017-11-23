const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 60000;

const currPlayers = {};

io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('join-game', (pos, address) => {
        socket.emit('load-players', currPlayers);

        currPlayers[address] = pos;
        
        socket.broadcast.emit('player-added', pos, address);
    });

    socket.on('move', (pos, address) => {
        socket.broadcast.emit('player-move', pos, address);
    });

    socket.on('disconnection', () => {
        console.log('disconnect');
    });

  });
  

http.listen(PORT, () => {
  console.log('listening on *:60000');
});