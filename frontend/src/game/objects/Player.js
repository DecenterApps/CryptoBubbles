import Phaser from 'phaser';

import { STARTING_PLAYERS_SPEED, playerNameStyle} from '../helpers/constants';
import { randomIntFromInterval } from '../helpers/utils';

export default class Player extends Phaser.Sprite {
  constructor (game, x, y, asset) {
    super(game, x, y, asset);

    this.game.add.existing(this);

    this.game.physics.arcade.enable(this);

    this.anchor.setTo(0.5);

    game.camera.follow(this);

    this.setPlayerName();

    // Set stats
    this.playerSpeed = STARTING_PLAYERS_SPEED;
    this.mass = 10;

    this.forkedPlayers = [];
  }

  update () {
    this.followMouse();
  }

  fork() {
    const xOffset = randomIntFromInterval(0, 20);
    const yOffset = randomIntFromInterval(0, 20);

    const forkedPlayer = this.game.add.sprite(this.x + xOffset, this.y + yOffset, 'decenter');

    console.log(this);

    this.game.physics.arcade.enable(forkedPlayer);
    forkedPlayer.anchor.setTo(0.5);

    this.addChild(forkedPlayer);

    this.game.add.existing(forkedPlayer);

    this.forkedPlayers.push(forkedPlayer);

    forkedPlayer.body.velocity.set(20);

  }

  prune() {

  }

  setPlayerName() {

    const label_score = this.game.add.text(this.width - 85, 0, "Nenad", playerNameStyle);
    
    this.addChild(label_score);
  }

  followMouse() {

    if (this.game.physics.arcade.distanceToPointer(this, this.game.input.activePointer) > 8) {
        this.game.physics.arcade.moveToPointer(this, this.calculateSpeed());

    } else {
        this.body.velocity.set(0);
    }

    this.forkedPlayers.forEach((fork, i) => {
      if (this.game.physics.arcade.distanceToPointer(fork, this.game.input.activePointer) > 58) {
        this.game.physics.arcade.moveToPointer(fork, this.calculateSpeed() - 30 * (i + 1) + (i*10));
      } else {
        fork.body.velocity.set(0);
      }
    });
  }

  calculateSpeed() {

    return this.playerSpeed - (this.mass / 2);
  }
}
