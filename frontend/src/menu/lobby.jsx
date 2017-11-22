import { h, render, Component } from 'preact';
import contract from 'truffle-contract';
import "./lobby.css";

import Web3 from 'web3'

import web3Helper from './web3Helper';

import gameManager from '../../../solidity/build/contracts/GameManager.json';
import gameToken from '../../../solidity/build/contracts/GameToken.json';

class Lobby extends Component {

    constructor(props) {
        super(props);

        this.state = {
            web3: null,
            gameManagerInstance: null,
            gameTokenInstance: null,
            tokenBalance: 0,
            tokensSubmited: 0,
            address: "",
            joinedUsers: [],
            numPlayers: 0
        }

        this.joinGame = this.joinGame.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
    }

    async componentWillMount() {
        web3Helper.then(async (results) => {
          const web3 = results.web3Instance;

          this.setState({
              web3,
          });



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
            const gameTokenInstance = await gameTokenContract.at("0xe004e3d3fe43582a85d2bf6471eb2a708316dabc");
            const gameManagerInstance = await gameManagerContract.at("0xb6d1fd007c22d2a70e2a3dd3f8fb38945de6b61f");
                
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

    async joinGame() {

        const numTokens = this.state.tokensSubmited;
        const managerInstance = this.state.gameManagerInstance;

        try {
            const res = await managerInstance.joinGame(web3.eth.accounts[0], numTokens, {from: web3.eth.accounts[0]});

            const event = res.logs[0];

            const newUser = {
                address: event.args.user,
                numTokens: event.args.numTokens.valueOf()
            };

            this.setState({
                tokensSubmited: 0,
                joinedUsers: [...this.state.joinedUsers, newUser]
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

                <input type="text" name="tokensSubmited" val={ this.state.tokensSubmited } onChange={ this.onInputChange }/>
                <button onClick={ this.joinGame }>Join Game</button>

                <ul>
                    {
                        this.state.joinedUsers.map(user => 
                        <li>User joined</li>
                        )
                    }
                </ul>
            </div>
        )
    }
}

// render an instance of Clock into <body>:
render(<Lobby />, document.body);