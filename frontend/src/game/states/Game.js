/* globals __DEV__ */
import Phaser from 'phaser';
import Player from '../objects/Player';

import web3Helper from '../helpers/web3Helper';
import scoreboard from '../helpers/scoreboard';
import socketHelper from '../helpers/socketHelper';
import { randomIntFromInterval } from '../helpers/utils';

let gameTime = 60; //1 min
let playersSpeed = 300;

const GAME_WIDTH = 2000;
const GAME_HEIGHT = 2000;

let isForked = false;

export default class extends Phaser.State {

  create () {

    this.players = {};
    this.dots = {};

    // Grabbing players information (addr, name, pos...)
    this.playerAddr = web3Helper.getUserAccount();
    this.playerInfo = localStorage.getItem(this.playerAddr);

    // create the world and enable physics
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    // create user and dot groups for collision checking
    this.dotGroup = this.game.add.group();
    this.playersGroup = this.game.add.group();

    // add the current player to the game
    this.player = this.addPlayer(this.generatePlayerPos(), this.playerAddr, JSON.parse(this.playerInfo).userName);

    this.currentPlayer = new Player(game, 50, 50, this.getSprite());

    // Handle fork action and pruning action
    this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.pKey = game.input.keyboard.addKey(Phaser.Keyboard.P);

    this.spaceKey.onDown.add(this.currentPlayer.fork, this.currentPlayer);

    //game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.P ]);

    this.setUpText();

    this.socket = socketHelper.socket;

    this.socket.emit('join-game', this.player.position, this.playerAddr);

    this.setupListeners();

    this.showTimer();

  }



  update() {
    this.socket.emit('move', this.player.position, this.playerAddr);

    this.game.physics.arcade.overlap(this.player, this.dotGroup, this.dotEaten, null, this);

    this.game.physics.arcade.overlap(this.player, this.playersGroup, this.playerEaten, null, this);

    //this.followMouse();

    const { x, y } = this.spriteCenter(this.player);

    this.playerNameText.x = x;
    this.playerNameText.y = y;

    // if (this.spaceKey.isDown && !isForked) {
    //   console.log("Fork!");
    //   // this.forkPlayer(this.player);
    //   isForked = true;
    //   this.currentPlayer.fork();
    // }

    if(this.pKey.isDown) {
      this.prunePlayer(this.player);
    }
  }

  getSprite() {
    const type = JSON.parse(this.playerInfo).type;

    if (type === 2) {
      return 'ethereum';
    } else if (type === 3) {
      return 'bitcoin';
    } else {
      return 'decenter';
    }
  }

  setUpText() {
    this.scoreText = game.add.text(window.innerWidth - 200, 50, "Score: 0");
    this.scoreText.fixedToCamera = true;

    this.timerText = game.add.text(30, 50, "Time left: 60");
    this.timerText.fixedToCamera = true;
  }

  playerText(currPlayer) {
    const style = { font: "14px Arial", fill: "#ffffff", wordWrap: true, wordWrapWidth: currPlayer.width, align: "center", stroke: '#000000', strokeThickness: 4 };
    const { x, y } = this.spriteCenter(currPlayer);

    console.log(currPlayer.name);

    this.playerNameText = game.add.text(x, y, currPlayer.name, style);
    this.playerNameText.anchor.set(0.5);

    currPlayer.nameText = this.playerNameText;
  }

  showTimer() {
    this.socket.on('seconds', (seconds) => {
      this.timerText.setText("Time left: " + (gameTime - seconds) + ' s');
    });
  }

  addPlayer(pos, address, name) {

    const currPlayer = this.game.add.sprite(pos.x, pos.y, 'decenter');
    
    this.game.physics.arcade.enable(currPlayer);
    this.playersGroup.add(currPlayer);
    currPlayer.anchor.set(0.5, 0.5);

    const radius = currPlayer.width / 2;

    currPlayer.body.setCircle(radius);

    currPlayer.address = address;
    currPlayer.name = name;

    console.log(name);

    this.players[address] = currPlayer;

    this.playerText(currPlayer);

    return currPlayer;
  }

  addDot(pos) {
    const dot = this.game.add.sprite(pos.x, pos.y, 'dot');
    this.game.physics.arcade.enable(dot);

    const radius = dot.width / 2;

    dot.body.setCircle(radius);

    this.dotGroup.add(dot);
    this.dots[pos.x + " " + pos.y] = dot;

  }

  dotEaten(player, dot) {
    this.socket.emit('dot-eaten', dot.position, this.playerAddr);
    dot.kill();
    this.addToScore(this.playerAddr, 1);

    const currScore = scoreboard.getScore(this.playerAddr);
    player.scale.set(1 + currScore/100, 1 + currScore/100);
    player.body.mass += 1;

    if (playersSpeed > 30) {
      playersSpeed -= 1;
    }
  
    this.updateScoreText(currScore);
  }

  playerEaten(player1, player2) {
     if (player1.body.mass > player2.body.mass) {
       const addr = player2.address;

       // update the score and the mass
       const loserScore = scoreboard.getScore(addr);

       scoreboard.updateScore(this.playerAddr, loserScore);
       scoreboard.setScore(addr, 0);

       player1.body.mass += player2.body.mass;
       playersSpeed -= 20;

       player2.kill();

       this.socket.emit('player-eaten', addr, this.playerAddr);
     }
  }

  growPlayer(address) {
    const currScore = scoreboard.getScore(address);
    this.players[address].scale.set(1 + currScore/100, 1 + currScore/100);
    this.players[address].body.mass += 1;
  }

  addToScore(address, points) {
    if(scoreboard.getScore(address) === 0) {
      scoreboard.setScore(address, points);
    } else {
      scoreboard.updateScore(address, points);
    }
  }

  updateScoreText(score) {
    this.scoreText.setText("Score: " + score);
  }

  generatePlayerPos() {
    return {
      x: randomIntFromInterval(100, GAME_WIDTH - 100),
      y: randomIntFromInterval(100, GAME_HEIGHT - 100),
    }
  }

  setupListeners() {

    scoreboard.init(JSON.parse(localStorage.getItem('score')));

    this.socket.on('load-players', (players) => {
      for (const address of Object.keys(players)) {
        if(this.playerAddr !== address) {
          this.addPlayer(players[address], address);
        }
      }
    });

    this.socket.on('load-dots', (dots) => {
      for (const key of Object.keys(dots)) {
        this.addDot(dots[key]);
      }
    });

    this.socket.on('player-move', (pos, address) => {
      if(this.players[address]) {
        const currPlayer = this.players[address];

        currPlayer.x = pos.x;
        currPlayer.y = pos.y;

        const { x, y } = this.spriteCenter(currPlayer);

        currPlayer.nameText.x = x;
        currPlayer.nameText.y = y;
      }
    });

    this.socket.on('player-added', (pos, address) => {
      this.addPlayer(pos, address);
    });

    this.socket.on('add-dot', (pos) => {
      this.addDot(pos);
    });

    this.socket.on('remove-dot', (pos, address) => {
      this.addToScore(address, 1);
      this.growPlayer(address);
      this.dots[pos.x + " " + pos.y].kill();
    });

    this.socket.on('player-dead', (addressLoser, addressWinner) =>  {
      if (this.playerAddr === addressLoser) {
        this.state.start('Dead');
      } else {
        this.players[addressLoser].kill();

        const loserScore = scoreboard.getScore(addressLoser);
        scoreboard.updateScore(addressWinner, loserScore);
        scoreboard.setScore(addressLoser, 0);
   
        this.players[addressWinner].body.mass += this.players[addressLoser].body.mass;
 
      }
    });

    this.socket.on('game-ended', () => {
      scoreboard.saveScore();
      //shutdown everything here

      // move to end screen
      window.location.href = '/end';
    });
  }

  prunePlayer(player) {
    //reduce mass
    player.body.mass -= 1;

    console.log('Prune', player.body.x, player.body.y);

    this.addDot({ x: player.body.x + randomIntFromInterval(-10, 10), 
        y: player.body.y + randomIntFromInterval(-10, 10) });

  }

  forkPlayer(player) {
    const currPlayer = this.game.add.sprite(player.x - 30, player.y - 30, 'decenter');
    
    this.game.physics.arcade.enable(currPlayer);
    this.playersGroup.add(currPlayer);
    currPlayer.anchor.set(0.5, 0.5);

    const radius = currPlayer.width / 2;

    currPlayer.body.setCircle(radius);

    player.fork = currPlayer;

  }

  // Helper functions

  spriteCenter(sprite) {
    const x = Math.floor(sprite.x);
    const y = Math.floor(sprite.y + (sprite.height / 3));

    return { x, y };
  }
}
