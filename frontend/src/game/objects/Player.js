import Phaser from 'phaser';

import { STARTING_PLAYERS_SPEED, playerNameStyle} from '../helpers/constants';
import { randomIntFromInterval } from '../helpers/utils';

import Dot from './Dot';
import ForkedPlayer from './ForkedPlayer';

export default class Player extends Phaser.Sprite {
  constructor (game, x, y, asset) {
    super(game, x, y, asset);

    this.game.add.existing(this);

    this.game.physics.arcade.enable(this);

    this.anchor.setTo(0.5);

    game.camera.follow(this);

    this.setPlayerName();

    game.playersGroup.add(this);

    // Set stats
    this.playerSpeed = STARTING_PLAYERS_SPEED;
    this.mass = 10;

    this.forkedPlayers = [];
  }

  update () {
    this.scale.set(1 + this.mass/100, 1 + this.mass/100);

    this.followMouse();
  }

  fork() {
    const xOffset = randomIntFromInterval(0, 20);
    const yOffset = randomIntFromInterval(0, 20);

    const forkedPlayer = new ForkedPlayer(this.game, this.x + xOffset, this.y + yOffset, 'decenter');

    this.forkedPlayers.push(forkedPlayer);
  }

  prune() {

    if (this.mass > 10) {
      this.mass -=1;

      const yOffset = randomIntFromInterval(0, 20);

      if (game.input.activePointer.x < this.x - game.camera.x) {
        new Dot(this.game, this.x + this.width, this.y + yOffset, 'dot');
      } else {
        new Dot(this.game, this.x - this.width, this.y + yOffset, 'dot');
      }
    }
  }

  dotEaten(dot) {
    dot.kill();
    this.mass += 1;
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
