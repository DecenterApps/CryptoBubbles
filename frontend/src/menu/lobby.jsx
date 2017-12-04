import { h, render, Component } from 'preact';
import contract from 'truffle-contract';
import "./lobby.css";

import Web3 from 'web3'

import web3Helper from './web3Helper';

import gameManager from '../../../solidity/build/contracts/GameManager.json';
import gameToken from '../../../solidity/build/contracts/GameToken.json';

import io from 'socket.io-client';

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
        }

        this.joinGame = this.joinGame.bind(this);
        this.buyTokens = this.buyTokens.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.manualStart = this.manualStart.bind(this);
        this.resetGame = this.resetGame.bind(this);
        this.joinGameFree = this.joinGameFree.bind(this);

        this.socket = io('http://localhost:60000');

        this.socket.on('game-started', () => {
            window.location.href = 'game.html';
        });

        this.socket.emit('get-users');

        this.socket.on('load-users', (users) => {
            this.setState({
                joinedUsers: users
            });
        });

        this.socket.on('add-user', (user) => {
            this.setState({
                joinedUsers: [...joinedUsers, user]
            });
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
          })

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
            const gameTokenInstance = await gameTokenContract.at("0xb75b76c67be99044dc054ba035642e363a659a74");
            const gameManagerInstance = await gameManagerContract.at("0x80d16eca42f39aeb239141d455b486ff05f115a9");
                
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

    onInputChange(event) {

        const name = event.target.name;
        const value = event.target.value;

        this.setState({
           [name]: value 
        });
    }

    render() {
        return (
            <div className="main-form">
                <div>Lobby of the game</div>
                <h3>Token Balance: { this.state.tokenBalance }</h3>
                <h4>{ this.state.numPlayers  } players have joined the game!</h4>

                {/* <input type="text" placeholder="Num of tokens" name="tokensSubmited" value={ this.state.tokensSubmited } onChange={ this.onInputChange }/> */}
                <input type="text" placeholder="Players name" name="playersName" value={ this.state.playersName } onChange={ this.onInputChange }/>
                <button onClick={ this.joinGameFree }>Join Game</button>

                <ul>
                    {
                        this.state.joinedUsers.map(user => 
                        <li>{ user.userName } : { user.numTokens } Tokens</li>
                        )
                    }
                </ul>

                <hr />

                <div>
                    {/* <input type="text" placeholder="Num of tokens to buy" name="tokensToBuy" value={ this.state.tokensToBuy } onChange={ this.onInputChange }/>
                    <button onClick={ this.buyTokens }>Buy Tokens</button> */}


                    <div>
                        { this.state.isAdmin &&
                            <button onClick={ this.manualStart }>Start Game</button>
                        }
                    </div>

                    <div>
                        { this.state.isAdmin &&
                            <button onClick={ this.resetGame }>Reset Game</button>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

// render an instance of Clock into <body>:
render(<Lobby />, document.body);