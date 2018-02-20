import { h, render, Component } from 'preact';
import contract from 'truffle-contract';
import "./lobby.css";

import Web3 from 'web3'
import Notifications, {notify} from 'react-notify-toast';

import web3Helper from './web3Helper';
import socketHelper from './socketHelper';
import config from './config';

import gameManager from '../../../solidity/build/contracts/GameManager.json';
import gameToken from '../../../solidity/build/contracts/GameToken.json';

const NUM_WEI_PER_TOKEN = 10000000000000;
const MIN_TOKENS = 1200;

import LoadingGif from './loading.gif';

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
            gameInProgress: false,
            alreadyJoined: false,
            isLoading: false,
            loadingText: 'Please wait while the transaction is being mined',
            inputError: ''
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
            localStorage.setItem('score', JSON.stringify(this.state.joinedUsers));
            window.location.href = 'game.html';
        });

        this.socket.on('load-users', (users, gameInProgress) => {
            const currUser = users.find(u => u.address === this.state.address);

            if (currUser) {
                this.setState({ alreadyJoined: true, playersName: currUser.userName });
            }

            this.setState({ joinedUsers: users, gameInProgress });
        });

        this.socket.on('add-user', (user) => {
            this.setState({
                joinedUsers: [...this.state.joinedUsers, user],
                numPlayers: ++this.state.numPlayers
            });
        });

        this.socket.on('game-starting', () => {
            this.setState({
                isLoading: true,
                loadingText: 'Prepare for battle the game is about to start...'
            })
        });

        // How many seconds of the game has passed (show in UI while people are waiting)
        this.socket.on('seconds', (sec) => {
            // console.log(sec);
        });
    }

    async componentWillMount() {
        web3Helper.then(async (results) => {
          const web3 = results.web3Instance;

          web3.eth.getAccounts(async (err, acc) => {
                const address = acc[0];

                this.setState({
                    web3,
                    address,
                    isAdmin: this.isAdmin(address),
                });

                this.socket.emit('get-users', address);

                await this.setupContracts();
                await this.getTokenBalance();
                await this.getNumPlayers();
            });

        });
    }

    //helper function
    isAdmin(address) {
        return (address === "0x93cdb0a93fc36f6a53ed21ecf6305ab80d06beca")
            || (address === "0x627306090abab3a6e1400e9345bc60c78a8bef57");
    }

    async setupContracts() {
        const gameManagerContract = contract(gameManager);
        gameManagerContract.setProvider(this.state.web3.currentProvider);

        const gameTokenContract = contract(gameToken);
        gameTokenContract.setProvider(this.state.web3.currentProvider);

        try {

            let gameTokenInstance, gameManagerInstance;

            if (config.network === 'kovan') {
                gameTokenInstance = await gameTokenContract.at("0x7d4910abd9b33ab92287a6ca66edbc8eb333ec6b");
                gameManagerInstance = await gameManagerContract.at("0x3e71b22d139607b97897e9cb7c1db109c1c2f20d");
            } else if (config.network === 'LOCAL') {
                gameTokenInstance = await gameTokenContract.deployed();
                gameManagerInstance = await gameManagerContract.deployed();
            }

            
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

            this.socket.emit('game-starting');

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

            this.socket.emit('reset');

            window.location.href = '/';

        } catch(err) {
            console.log(err);
        }
    }

    async joinGame() {

        // const numTokens = this.state.tokensSubmited;
        // const managerInstance = this.state.gameManagerInstance;

        // if (numTokens < MIN_TOKENS) {
        //     console.log("Need more tokens");
        // }

        // try {
        //     const res = await managerInstance.joinGame(web3.eth.accounts[0], numTokens, {from: web3.eth.accounts[0]});

        //     const event = res.logs[0];

        //     const newUser = {
        //         address: event.args.user,
        //         numTokens: event.args.numTokens.valueOf()
        //     };

        //     this.socket.emit('user-joined', newUser);

        //     this.setState({
        //         tokensSubmited: 0,
        //         joinedUsers: [...this.state.joinedUsers, newUser],
        //         numPlayers: ++this.state.numPlayers
        //     });

        // } catch(err) {
        //     console.log('ERR', err);
        // }
    }

    async joinGameFree() {

        const managerInstance = this.state.gameManagerInstance;

        let inputErr = 'You must enter a username!';

        if (this.state.playersName === '') {
            this.setState({
                inputError
            });

            return;
        }

        if (this.state.playersName.length > 15) {
            this.setState({
                inputError: 'A username must be shorter than 15 letters'
            });

            return;
        }

        try {

            this.setState({
               isLoading: true
            });

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
                alreadyJoined: true,
                isLoading: false
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
                <div> - You currently own { this.state.tokenBalance } BT - </div>
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
                { this.state.isLoading && 
                    <div>
                        <img src={ LoadingGif } width='60' height='60' />
                        <div className="loading-text">{ this.state.loadingText }</div>
                    </div>
                }
                    
                    <div className="control">
                        <div className="label">{ this.state.inputError }</div>
                        <input 
                            type="text" 
                            placeholder="Username" 
                            name="playersName"
                            value={ this.state.playersName } 
                            onChange={ this.onInputChange } 
                            disabled={ this.state.alreadyJoined }
                            className="form-control"
                        />
                    </div>
                    
                    <div align="center">
                         <button className="btn btn-orange" onClick={ this.joinGameFree } disabled={ this.state.alreadyJoined }>
                            { this.state.alreadyJoined ? 'Game Joined!' : 'Join Game'}
                         </button>
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