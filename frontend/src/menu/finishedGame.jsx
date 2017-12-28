import { h, render, Component } from 'preact';
import contract from 'truffle-contract';

import web3Helper from './web3Helper';
import socketHelper from './socketHelper';

import gameManager from '../../../solidity/build/contracts/GameManager.json';

import './finishedGame.css';

class FinishedGame extends Component {

    constructor(props) {
        super(props);

        //grab the score
        const scoreInStorage = localStorage.getItem('score');

        let score = [];

        if (scoreInStorage) {
            score = JSON.parse(scoreInStorage);
        }

        this.state = {
            web3: null,
            numPlayersVoted: 0,
            pointsWon: 0,
            score,
            address: '',
            gameManagerInstance: null,
            usersWhoVoted: [],
            scoreboard: [],
            tokensWon: 0,
            hasVoted: false,
            gameFinalized: false,
            btnText: 'Unlock tokens!'
        };

        console.log(score);

        this.socket = socketHelper();

        this.socket.on('in-voting', (inVoting, votes, scoreboard) => {
            if(!inVoting) {
                window.location.href = "/";
            }


            this.setState({
                numPlayersVoted: votes.length,
                usersWhoVoted: votes,
                scoreboard,
            });
        });

        this.socket.on('load-votes', (votes) => {
            console.log('Load votes', votes);

            this.setState({
                numPlayersVoted: votes.length,
                usersWhoVoted: votes,
                hasVoted: this.userVoted(votes)
            });
        });

        this.socket.on('game-finalized', () => {
            console.log("Yay! Game finished!");

            this.setState({
               gameFinalized: true,
               btnText: 'Play Again!'
            });
        });

        this.submitState = this.submitState.bind(this);
        this.parseStateForContract = this.parseStateForContract.bind(this);  

    }

    async componentWillMount() {

        this.socket.emit('in-voting');

        web3Helper.then(async (results) => {
          const web3 = results.web3Instance;

          const gameManagerContract = contract(gameManager);
          gameManagerContract.setProvider(web3.currentProvider);

          try {
            const gameManagerInstance = await gameManagerContract.at("0xb859feb83f45977ada8f61b14f8e12696745b2ae");
            
            const currUser = this.state.score.find(user => user.address === web3.eth.accounts[0]);

            if (currUser) {
                this.setState({
                    tokensWon: currUser.score
                });
            }

            gameManagerInstance.Voted((err, res) => {
                console.log("Voted event", res.args);
    
                if (!this.userVoted()) {
                    this.setState({
                        numPlayersVoted: ++this.state.numPlayersVoted
                    });
                }
            });

            gameManagerInstance.GameFinalized((err, res) => {
                console.log("Game End", res);
    
                //switch to index
            });

            this.setState({
                gameManagerInstance,
            });

            this.socket.emit('load-votes');
            
          } catch(err) {
              console.log(err);
          }


          this.setState({
              web3,
              address: web3.eth.accounts[0]
          });
        });
    }

    async submitState() {
        
        if (this.state.gameFinalized) {
            window.location.href = "/";
            return;
        }

        try {
    
          const user = localStorage.getItem(this.state.address);
    
          if(user) {

            const state = Object.values(this.state.scoreboard);

            try {

                await this.state.gameManagerInstance.gameEnds(state, JSON.parse(user).position, {from: this.state.address}); 
                
                // send to server
                this.socket.emit('voted', JSON.parse(user));

            } catch(err) {
                console.log(err);
            }
            
          } else {
            console.log("Unable to find the user, call the server");
          }
    
    
        } catch(err) {
          console.log(err);
        }
    }

    parseStateForContract() {
        return this.state.score.map(s => s.score);
    }

    userVoted(newVotes) {
        const votes = newVotes || this.state.usersWhoVoted;
        const youFoundMe = votes.find(v => v.address === this.state.address);

        return youFoundMe ? true : false;
    }

    render() {
        return (
            <div className="row login_box">
            <div className="col-md-12 col-xs-12" align="center">
                <div className="line">
                    { this.state.gameFinalized ? 
                    <h3>Game is Done!</h3> : <h3>Game is Finalized!</h3>
                    }
                </div>
            </div>
            <div className="col-md-6 col-xs-6 follow line" align="center">
                <h3>
                    {this.state.numPlayersVoted}/5 <br/> <span>People voted!</span>
                </h3>
            </div>
            <div className="col-md-6 col-xs-6 follow line" align="center">
                <h3>
                     { this.state.tokensWon } BT<br/> <span>Tokens you won!</span>
                </h3>
            </div>

            <div className="col-md-12 col-xs-12" align="center">
                
            </div>

            { !this.state.gameFinalized && <div>
                * In order for a game to be finalized and the tokens  <br /> 
                you won to be released, you MUST unlock the tokens by clicking <br />
                the button below. Users that don't finalize the state will lose their <br />
                tokens and will be banned from future games.
            </div>
            }
            
            { !this.state.hasVoted &&
                <div className="col-md-12 col-xs-12 login_control">
                    <div align="center">
                        <button className="btn btn-orange" onClick={ this.submitState }>{ this.state.btnText }</button>
                    </div>
                </div>
            }

            {
                this.state.usersWhoVoted.length > 0 &&
                <div className="joined-users">
                    <h3>Joined users: </h3>
                    <ul className="joined-users-list">
                      {
                        this.state.usersWhoVoted.map((user, i) => (
                          <li key={user.userName}>
                            {user.userName} Voted!
                          </li>
                        ))
                      }
                    </ul>
                </div>
            }
        </div>
        );
    }
};

export default FinishedGame;