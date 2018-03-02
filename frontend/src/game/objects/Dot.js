import Phaser from 'phaser';

export default class Dot extends Phaser.Sprite {
    constructor (game, x, y, asset) {
      super(game, x, y, asset);

      this.game.add.existing(this);

      this.game.physics.arcade.enable(this);

      this.anchor.setTo(0.5);

      game.dotGroup.add(this);

    }

};