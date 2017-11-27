import 'pixi';
import 'p2';
import Phaser from 'phaser';

import BootState from './states/Boot';
import SplashState from './states/Splash';
import GameState from './states/Game';
import DeadState from './states/Dead';
import GameFinishedState from './states/GameFinished';


class Game extends Phaser.Game {
  constructor () {
    const docElement = document.documentElement
    const width = docElement.clientWidth;
    const height = docElement.clientHeight;

    super(width, height, Phaser.CANVAS, 'content', null);

    this.state.add('Boot', BootState, false);
    this.state.add('Splash', SplashState, false);
    this.state.add('Game', GameState, false);
    this.state.add('Dead', DeadState, false);
    this.state.add('GameFinished', GameFinishedState, false);

    this.state.start('Boot');
  }
}

window.game = new Game()

