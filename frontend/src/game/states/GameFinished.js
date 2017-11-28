import Phaser from 'phaser'

export default class extends Phaser.State {
  create () {

    game.add.tileSprite(0, 0, game.world.width, game.world.height, 'background');

    this.form = new Phaser.Rectangle(0, 550, 800, 50);


    const style = { font: "16px Courier", fill: "#fff", tabs: [ 274, 120] };
    
    const headings = [ 'Name', 'Score' ];

    const header = game.add.text((game.world.width / 2) - 200, (game.world.height / 2) - 200, '', style);
    header.parseList(headings);

    const score = [
        [ '0x2348230984932470823', '1d3'],
        [ 'Dagger', '1d4'],
        [ 'Rapier', '1d6'],
        [ 'Sabre', '1d6'],
    ];

    var text = game.add.text((game.world.width / 2) - 200, (game.world.height / 2) - 150, '', style);
    text.parseList(score);

    game.add.button(200, 200);

    this.submitStateBtn = game.add.button(game.world.centerX - 130, 400, 'button', this.submitState, this, 2, 1, 0);

  }

  submitState() {
    console.log("Submit state called");
  }

  render() {
  }

}