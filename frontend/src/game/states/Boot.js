import Phaser from 'phaser'
import WebFont from 'webfontloader'

import socketHelper from '../helpers/socketHelper';
import web3Helper from '../helpers/web3Helper';

export default class extends Phaser.State {
  init () {
    this.stage.backgroundColor = '#2B2B2B';
    this.fontsReady = false;
    this.canEnterGame = false;
    this.fontsLoaded = this.fontsLoaded.bind(this);
  }

  preload () {

    this.acc = web3Helper.getUserAccount();

    let text = this.add.text(this.world.centerX, this.world.centerY, 'Loading the game...', { font: '20px Arial', align: 'center' });
    text.anchor.setTo(0.5, 0.5);

    this.load.image('decenter', 'assets/images/decenter-logo.png');
    this.load.image('background', 'assets/images/tile.jpeg');    
    this.load.image('dot', 'assets/images/dot.png');
    game.load.spritesheet('button', 'assets/button_sprite_sheet.png', 150, 50);   

    setTimeout(() => {

      socketHelper.socket.emit('can-enter', this.acc);
  
      socketHelper.socket.on('client-enter', (res) => {

        //this.canEnterGame = res;
        this.canEnterGame = true;

        if(!res) {
          text.setText("Sorry you are not a register player in the current game");

          // setTimeout(() => {
          //   window.location.href = 'index.html';
          // }, 2000);
        }

        socketHelper.socket.emit('can-enter', this.acc);
        this.acc = web3Helper.getUserAccount();
      });
  
      WebFont.load({
        google: {
          families: ['Bangers']
        },
        active: this.fontsLoaded
      });
  
    }, 1400);
  }

  render () {
    if (this.fontsReady && this.canEnterGame) {
      this.state.start('Game');
    }
  }

  fontsLoaded () {
    this.fontsReady = true
  }
}
