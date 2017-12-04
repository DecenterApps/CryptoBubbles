import Phaser from 'phaser';

import scoreboard from '../helpers/scoreboard';
import web3Helper from '../helpers/web3Helper';

export default class extends Phaser.State {
  create () {

    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    this.form = new Phaser.Rectangle(0, 550, 800, 50);


    const style = { font: "16px Courier", fill: "#fff", tabs: [ 274, 120] };
    
    const headings = [ 'Name', 'Score' ];

    const header = game.add.text((window.innerWidth/ 2) - 200, (game.world.height / 2) - 200, '', style);
    header.parseList(headings);

    this.scoreState = scoreboard.formatForContract();

    const score = scoreboard.formatForDisplay();

    console.log(score, this.scoreState);

    var text = game.add.text((window.innerWidth / 2) - 200, (game.world.height / 2) - 150, '', style);
    text.parseList(score);

    game.add.button(200, 200);

    this.address = web3Helper.getUserAccount();

    this.submitStateBtn = game.add.button((window.innerWidth / 2) - 130, 400, 'button', this.submitState, this, 2, 1, 0);

  }

  submitState() {
    console.log("Submit state called");
    try {

      const user = localStorage.getItem(this.address);

      if(user) {
        web3Helper.submitScoreState(this.scoreState, JSON.parse(user).position, (res) => {
          console.log(res);
        });
      } else {
        console.log("Unable to find the user, call the server");
      }


    } catch(err) {
      console.log(err);
    }
  }

  render() {
  }

}