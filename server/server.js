
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
let gameInVoting = false;

const GAME_TIME = 1000 * 60 * 1; //1 minute
const WAIT_FOR_VOTES = 1000 * 180; //3 minutes

let secondsInGame = 0;
let secondsInterval;

io.on('connection', async (socket) => {
    console.log('a user connected');

    socket.on('start-game', async () => {

        const gameHasStarted = await gameManager.hasGameStarted();

        console.log("Game started on contract?", gameHasStarted);


        if (gameHasStarted && !gameInProgress) {
            io.sockets.emit('game-started');
            gameStarted = true;
            gameInProgress = true;

            startClock();

            setTimeout(() => {
                
                io.sockets.emit('game-ended', scoreboard);
                gameStarted = false;
                gameInProgress = false;
                gameInProgress = true;

                clearInterval(secondsInterval);

                submitVotesInterval();

            }, GAME_TIME)
    
            generateDots();
        }
    });

    socket.on('get-users', () => {
        socket.emit('load-users', lobby, gameInProgress);
    });

    socket.on('user-joined', (user) => {
        lobby.push(user);
        socket.broadcast.emit('add-user', user);
    });

    socket.on('can-enter', (addr) => {
        const foundUser = lobby.find(u => u.address === addr);

        let res = false;

        if (foundUser) {
            res = true;
        }

        socket.emit('client-enter', res);

    });

    socket.on('in-voting', () => {
        socket.emit('in-voting', gameInVoting);
    });

    if (gameStarted) {
        socket.on('join-game', (pos, address) => {
            socket.emit('load-players', currPlayers);
            socket.emit('load-dots', dots);
    
            currPlayers[address] = pos; 
            
            // Does this emit to the calling socket?
            socket.broadcast.emit('player-added', pos, address);
        });
    
        socket.on('move', (pos, address) => {
            socket.broadcast.emit('player-move', pos, address);
        });
    
        socket.on('player-eaten', (addressLoser, addressWinner) => {
            socket.broadcast.emit('player-dead', addressLoser, addressWinner);

            // Update player list and scoreboard
            // TODO: add an alive field
            currPlayers[addressLoser] = {};
            scoreboard[addressWinner] += scoreboard[addressLoser];
            scoreboard[addressLoser] = 0; 
        });

        //when the player has eaten the dot
        socket.on('dot-eaten', (pos, address) => {
            if(pos.x && pos.y) {
                socket.broadcast.emit('remove-dot', pos, address)
                delete dots[pos.x + " " + pos.y];

                addPoints(address, 1);

                io.sockets.emit('add-dot', createDot());
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


function nameAlreadyExists(name) {
    const foundUser = lobby.find(user => user.userName === name);

    if(foundUser) {
        return true;
    }

    return false;
}

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

function createDot() {
    const pos = {
        x: randomIntFromInterval(1, GAME_WIDTH),
        y: randomIntFromInterval(1, GAME_HEIGHT)
    };

    dots[pos.x + " " + pos.y] = pos;

    return pos;
}

function submitVotesInterval() {
    setTimeout(() => {

    }, WAIT_FOR_VOTES)
}

function startClock() {
    secondsInterval = setInterval(() => {
        console.log(secondsInGame);
        secondsInGame++;
        io.sockets.emit('seconds', secondsInGame);
    }, 1000);
}
 

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}