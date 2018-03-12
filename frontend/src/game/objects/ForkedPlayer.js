import Phaser from 'phaser';

import { STARTING_PLAYERS_SPEED } from '../helpers/constants';
import { randomIntFromInterval } from '../helpers/utils';

import Dot from './Dot';

export default class ForkedPlayer extends Phaser.Sprite {
  constructor (game, x, y, asset) {
    super(game, x, y, asset);

    this.game.physics.arcade.enable(this);
    this.anchor.setTo(0.5);

    this.game.add.existing(this);

    this.body.velocity.set(20);

    game.playersGroup.add(this);

    this.playerSpeed = STARTING_PLAYERS_SPEED;
    this.mass = 10;
  }

}