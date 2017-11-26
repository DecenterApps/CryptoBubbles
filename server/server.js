const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const gameManager = require('./game-manager');

const PORT = process.env.PORT || 60000;

const currPlayers = {};
const dots = {};
const lobby = [];
const scoreboard = {};

const GAME_WIDTH = 2000;
const GAME_HEIGHT = 2000;

let gameStarted = false;
let gameInProgress = false;


io.on('connection', async (socket) => {
    console.log('a user connected');

    socket.on('start-game', async () => {

        const gameHasStarted = await gameManager.hasGameStarted();

        if (gameHasStarted && !gameInProgress) {
            io.sockets.emit('game-started');
            gameStarted = true;
            gameInProgress = true;
    
            generateDots();
        }
    });

    socket.on('get-users', () => {
        socket.emit('load-users', lobby);
    });

    socket.on('user-joined', (user) => {
        lobby.push(user);
        socket.broadcast.emit('add-user');
    });

    if (gameStarted) {
        socket.on('join-game', (pos, address) => {
            socket.emit('load-players', currPlayers);
            socket.emit('load-dots', dots);
    
            currPlayers[address] = pos; 
            
            //Does this emit to the calling socket?
            socket.broadcast.emit('player-added', pos, address);
        });
    
        socket.on('move', (pos, address) => {
            socket.broadcast.emit('player-move', pos, address);
        });
    
        //when the player has eaten the dot
        socket.on('dot-eaten', (pos, address) => {
            if(pos.x && pos.y) {
                socket.broadcast.emit('remove-dot', pos, address)
                delete dots[pos.x + " " + pos.y];

                addPoints(address, 1);
            }
        });
    
        socket.on('disconnection', () => {
            console.log('disconnect');
        });
    }

  });
  

http.listen(PORT, () => {
  console.log('listening on *:60000');
});

function addPoints(address, points) {
    if (scoreboard[address]) {
        scoreboard[address] += points;
    } else {
        scoreboard[address] = points;
    }
}

//TODO: limit the amount generated to not go over the amount in contract
//TODO: Wut if 2 dots on same pos?
function generateDots() {

    for(let i = 0; i < 200; ++i) {
        const pos = {
            x: randomIntFromInterval(1, GAME_WIDTH),
            y: randomIntFromInterval(1, GAME_HEIGHT)
        };

        dots[pos.x + " " + pos.y] = pos;

    }
}
 

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}