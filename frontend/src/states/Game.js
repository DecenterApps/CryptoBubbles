/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../objects/Player'

export default class extends Phaser.State {

  create () {

    this.game.physics.startSystem(Phaser.Physics.ARCADE);    

    this.player = this.game.add.sprite(300, 300, 'mushroom');

    this.player.anchor.set(0.5);
    
    this.game.physics.arcade.enable(this.player);
  }

  render () {
  }

  update() {
    if (this.game.physics.arcade.distanceToPointer(this.player, this.game.input.activePointer) > 8)
    {
        this.game.physics.arcade.moveToPointer(this.player, 300);
    }
    else
    {
        this.player.body.velocity.set(0);
    }
  }
}
