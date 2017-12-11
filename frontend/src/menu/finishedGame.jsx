import { h, render, Component } from 'preact';

class FinishedGame extends Component {

    constructor(props) {
        super(props);

        //grab the score
        this.state = {
            numPlayersVoted: 0,
        };
    }

    render() {
        return (
            <div className="row login_box">
            <div className="col-md-12 col-xs-12" align="center">
                <div className="line">
                    <h3>Game is Done!</h3>
                </div>
            </div>
            <div className="col-md-6 col-xs-6 follow line" align="center">
                <h3>
                    {this.state.numPlayersVoted}/5 <br/> <span>People voted!</span>
                </h3>
            </div>
            <div className="col-md-6 col-xs-6 follow line" align="center">
                <h3>
                     1000 BT<br/> <span>Tokens for entry</span>
                </h3>
            </div>

            <div className="col-md-12 col-xs-12" align="center">
                kdfds
            </div>
            
            <div className="col-md-12 col-xs-12 login_control">
                    
                    <div align="center">
                         <button className="btn btn-orange" onClick={ this.joinGameFree }>Finalize Game</button>
                    </div>
                    
            </div>
        </div>
        );
    }
};

export default FinishedGame;