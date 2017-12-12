import { h, render, Component } from 'preact';
import contract from 'truffle-contract';
import "./lobby.css";

import Web3 from 'web3'
import Notifications, {notify} from 'react-notify-toast';

import web3Helper from './web3Helper';
import socketHelper from './socketHelper';

import gameManager from '../../../solidity/build/contracts/GameManager.json';
import gameToken from '../../../solidity/build/contracts/GameToken.json';

const NUM_WEI_PER_TOKEN = 10000000000000;
const MIN_TOKENS = 1200;

class Lobby extends Component {

    constructor(props) {
        super(props);

        this.state = {
            web3: null,
            gameManagerInstance: null,
            gameTokenInstance: null,
            tokenBalance: 0,
            tokensSubmited: '',
            tokensToBuy: '',
            address: "",
            joinedUsers: [],
            numPlayers: 0,
            isAdmin: false,
            playersName: '',
            isPreSale: true,
            gameInProgress: false
        };

        this.joinGame = this.joinGame.bind(this);
        this.buyTokens = this.buyTokens.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.manualStart = this.manualStart.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.joinGameFree = this.joinGameFree.bind(this);

        this.socket = socketHelper();

        this.socket.on('game-started', () => {
            console.log("Game started");
            window.location.href = 'game.html';
        });

        this.socket.on('load-users', (users, gameInProgress) => {
            console.log(gameInProgress);
            this.setState({ joinedUsers: users, gameInProgress });
        });

        this.socket.on('add-user', (user) => {
            this.setState({
                joinedUsers: [...this.state.joinedUsers, user],
                numPlayers: ++this.state.numPlayers
            });
        });

        // How many seconds of the game has passed (show in UI while people are waiting)
        this.socket.on('seconds', (sec) => {
            // console.log(sec);
        });
    }

    async componentWillMount() {
        web3Helper.then(async (results) => {
          const web3 = results.web3Instance;

          this.setState({
              web3,
          });

          this.setState({
              isAdmin: web3.eth.accounts[0] === "0x93cdb0a93fc36f6a53ed21ecf6305ab80d06beca"
          });

          this.socket.emit('get-users', web3.eth.accounts[0]);

          await this.setupContracts();
          await this.getTokenBalance();
          await this.getNumPlayers();

        });
    }

    async setupContracts() {
        const gameManagerContract = contract(gameManager);
        gameManagerContract.setProvider(this.state.web3.currentProvider);

        const gameTokenContract = contract(gameToken);
        gameTokenContract.setProvider(this.state.web3.currentProvider);

        try {
            const gameTokenInstance = await gameTokenContract.at("0x6b17c11b0617f2d4fcd8f5f963077c7fca9f3bff");
            const gameManagerInstance = await gameManagerContract.at("0x386f7db51eb2e7f0bdbec79023616769c9b29936");
                
            this.setState({
                gameTokenInstance,
                gameManagerInstance
            });
        } catch(err) {
            console.log(err);
        }
    }

    async getTokenBalance() {

        try {
            const res = await this.state.gameTokenInstance.balanceOf(web3.eth.accounts[0]);
            
            this.setState({
                tokenBalance: res.valueOf()
            });
        } catch(err) {
            console.log(err);
        }
    }

    async getNumPlayers() {
        const res = await this.state.gameManagerInstance.currPlayerIndex();
        
        this.setState({
            numPlayers: res.valueOf()
        });
    }

    async buyTokens() {
        try {

            const tokensToBuy = this.state.tokensToBuy;

            const ethPrice = tokensToBuy * NUM_WEI_PER_TOKEN;

            const res = await this.state.gameTokenInstance
                        .buyAndApprove("0x3da2ce9724a918029ce1b8281274ec110277c4ff", {from: web3.eth.accounts[0], value: ethPrice});

            this.setState({
                tokensToBuy: ''
            });

            await this.getTokenBalance();

        } catch(err) {
            console.log(err);
        }
    }

    async manualStart() {
        try {
            await this.state.gameManagerInstance.startGame({from: web3.eth.accounts[0]});

            console.log("Starting game...");

            this.socket.emit('start-game');

        } catch(err) {
            console.log(err);
        }
    }

    async resetGame() {
        try {

            await this.state.gameManagerInstance.resetGame({from: web3.eth.accounts[0]});

            console.log("reset");

        } catch(err) {
            console.log(err);
        }
    }

    async joinGame() {

        const numTokens = this.state.tokensSubmited;
        const managerInstance = this.state.gameManagerInstance;

        if (numTokens < MIN_TOKENS) {
            console.log("Need more tokens");
        }

        try {
            const res = await managerInstance.joinGame(web3.eth.accounts[0], numTokens, {from: web3.eth.accounts[0]});

            const event = res.logs[0];

            const newUser = {
                address: event.args.user,
                numTokens: event.args.numTokens.valueOf()
            };

            localStorage.setItem(newUser.address, this.state.playersName);

            this.socket.emit('user-joined', newUser);

            this.setState({
                tokensSubmited: 0,
                joinedUsers: [...this.state.joinedUsers, newUser],
                numPlayers: ++this.state.numPlayers
            });

        } catch(err) {
            console.log('ERR', err);
        }
    }

    async joinGameFree() {

        const managerInstance = this.state.gameManagerInstance;

        try {

            const res = await managerInstance.joinGameFree({from: web3.eth.accounts[0]});

            const event = res.logs[0];

            const newUser = {
                address: event.args.user,
                userName: this.state.playersName,
                numTokens: event.args.numTokens.valueOf(),
                position: this.state.numPlayers
            };

            localStorage.setItem(newUser.address, JSON.stringify(newUser));

            this.socket.emit('user-joined', newUser);

            this.setState({
                tokensSubmited: 0,
                joinedUsers: [...this.state.joinedUsers, newUser],
                numPlayers: ++this.state.numPlayers,
                playersName: ''
            });

        } catch(err) {
            console.log('ERR', err);
        }
    }

    onInputChange(event) {

        const name = event.target.name;
        const value = event.target.value;

        this.setState({
           [name]: value 
        });
    }

    render() {
        return (
            <div className="row login_box">
            <div className="title-wrapper line">
                {
                    this.state.gameInProgress &&
                    <h3>A game is currently in progress!</h3>
                }
                {
                    !this.state.gameInProgress &&
                    <h3>Crypto Bubbles</h3>
                }
                {/* <div className="outter"><img src="https://www.ethereum.org/images/logos/ETHEREUM-ICON_Black_small.png" className="image-circle"/></div>    */}
                {/* <h2>CryptoBubbles</h2>
                <span>Game time 10 minutes</span> */}
            </div>
            <div>
                <div className="col-md-6 col-xs-6 follow line" align="center">
                    <h3>
                        {this.state.numPlayers}/5 <br/> <span>People joined</span>
                    </h3>
                </div>
                <div className="col-md-6 col-xs-6 follow line" align="center">
                    <h3>
                         1000 BT<br/> <span>Tokens for entry</span>
                    </h3>
                </div>
            </div>

            <div className="login_control">
                    
                    <div className="control">
                        <div className="label">Username</div>
                        <input type="text" placeholder="Username" name="playersName" value={ this.state.playersName } onChange={ this.onInputChange } className="form-control"/>
                    </div>
                    
                    <div align="center">
                         <button className="btn btn-orange" onClick={ this.joinGameFree }>Join Game</button>
                    </div>

                    <div>
                        { this.state.isAdmin &&
                            <button className="btn btn-orange" onClick={ this.manualStart }>Start Game</button>
                        }
                    </div>

                    <div>
                        { this.state.isAdmin &&
                            <button className="btn btn-orange" onClick={ this.resetGame }>Reset Game</button>
                        }
                    </div>
                    
            </div>

            {
                this.state.joinedUsers.length > 0 &&
                <div className="joined-users">
                    <h3>Joined users: </h3>
                    <ul className="joined-users-list">
                      {
                        this.state.joinedUsers.map((user, i) => (
                          <li key={user.userName}>
                            {user.userName} ({user.numTokens} BT)
                          </li>
                        ))
                      }
                    </ul>
                </div>
            }
        </div>
        );
    }
}

export default Lobby;