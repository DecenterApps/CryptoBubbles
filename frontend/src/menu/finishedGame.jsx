import { h, render, Component } from 'preact';

import web3Helper from './web3Helper';
import socketHelper from './socketHelper';


class FinishedGame extends Component {

    constructor(props) {
        super(props);

        //grab the score
        const score = localStorage.getItem('score');

        this.state = {
            web3: null,
            numPlayersVoted: 0,
            score,
            address: ''
        };

        this.socket = socketHelper();

        this.socket.on('in-voting', (inVoting) => {
            console.log(" in voting ", inVoting);

            // if(!inVoting) {
            //     window.location.href = "/";
            // }
        });

    }

    async componentWillMount() {

        this.socket.emit('in-voting');

        web3Helper.then(async (results) => {
          const web3 = results.web3Instance;

          //set up the address here


          this.setState({
              web3,
              address: web3.eth.accounts[0]
          });
        });
    }

    submitState() {
        console.log("Submit state called");
        try {
    
          const user = localStorage.getItem(this.state.address);
    
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