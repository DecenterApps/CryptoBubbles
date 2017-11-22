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
            address: ""
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

        });
    }

    async setupContracts() {
        const gameManagerContract = contract(gameManager);
        gameManagerContract.setProvider(this.state.web3.currentProvider);

        const gameTokenContract = contract(gameToken);
        gameTokenContract.setProvider(this.state.web3.currentProvider);

        try {
            const gameTokenInstance = await gameTokenContract.at("0x94bc1c5d29d0e084f9d711b230ab2f2aa201cc29");
            const gameManagerInstance = await gameManagerContract.at("0x8b587afd2a01f4ce66b5920a5c0272f92285ca50");
                
            this.setState({
                gameTokenInstance,
                gameManagerInstance
            });
        } catch(err) {
            console.log(err);
        }
    }

    async getTokenBalance() {

        const res = await this.state.gameTokenInstance.balanceOf("0x93cdB0a93Fc36f6a53ED21eCf6305Ab80D06becA");

        this.setState({
            tokenBalance: res.valueOf()
        });
    }

    async joinGame() {
        const numTokens = this.state.tokensSubmited;
        const managerInstance = this.state.gameManagerInstance;

        console.log(web3.eth.accounts[0]);

        const res = await managerInstance.joinGame(web3.eth.accounts[0], numTokens, {from: web3.eth.accounts[0]});

        console.log(res);

        this.setState({
            tokensSubmited: 0
        });
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

                <input type="text" name="tokensSubmited" val={ this.state.tokensSubmited } onChange={ this.onInputChange }/>
                <button onClick={ this.joinGame }>Join Game</button>
            </div>
        )
    }
}

// render an instance of Clock into <body>:
render(<Lobby />, document.body);