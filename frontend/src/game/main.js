import 'pixi';
import 'p2';
import Phaser from 'phaser';

import BootState from './states/Boot';
import GameState from './states/Game';
import DeadState from './states/Dead';


class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement
    const width = docElement.clientWidth;
    const height = docElement.clientHeight;

    super(width, height, Phaser.CANVAS, 'content', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Dead', DeadState, false);

    this.state.start('Boot');
  }
}

window.game = new Game()

