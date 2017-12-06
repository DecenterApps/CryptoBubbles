import Phaser from 'phaser'

import socketHelper from '../helpers/socketHelper';

export default class extends Phaser.State {
  init () {}

  create() {
    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    const graphics = game.add.graphics(100, 100);

    graphics.lineStyle(2, 0xede7e1, 1);
    graphics.beginFill(0xede7e1, 0.9);
    graphics.drawRect((window.innerWidth / 2) - 320, (window.innerHeight / 2) - 350, 500, 500);
    graphics.endFill();

    game.add.text((window.innerWidth / 2) - 160, (window.innerHeight / 2) - 220, 'Ouch your bubble has popped!');

    game.add.text((window.innerWidth / 2) - 180, (window.innerHeight/ 2) - 160, 'Please wait until game is finished');

    const timerText = game.add.text((window.innerWidth / 2) - 60, (window.innerHeight / 2) - 20, 'Time left: ');

    // Time left until game is finished

    const socket = socketHelper.socket;

    socket.on('game-ended', () => {
      this.state.start('GameFinished');
    });

    socket.on('seconds', (seconds) => {
      timerText.setText('Time left: ' + seconds + " s");
    });

  }

}