
import { h, render, Component } from 'preact';

class Clock extends Component {

    render() {
        return (
            <div>
                <div>Lobby of the game</div>
                <a href="game.html">Enter game</a>
            </div>
        )
    }
}

// render an instance of Clock into <body>:
render(<Clock />, document.body);