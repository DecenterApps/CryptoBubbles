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
            tokenBalance: 0
        }
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
            const gameTokenInstance = await gameTokenContract.at("0x2e681a5e31031507d42596bfc415387d43752f96");
            const gameManagerInstance = await gameManagerContract.at("0x98f3482a065680e05fbc7147beadaa6f9d624259");
                
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

    render() {
        return (
            <div className="main-form">
                <div>Lobby of the game</div>
                <h3>Token Balance: { this.state.tokenBalance }</h3>
                <a href="game.html">Enter game</a>
            </div>
        )
    }
}

// render an instance of Clock into <body>:
render(<Lobby />, document.body);