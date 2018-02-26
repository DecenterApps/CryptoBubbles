import { h, render, Component } from 'preact';
import Router from 'preact-router';
import Lobby from './lobby.jsx';
import FinishedGame from './finishedGame.jsx';

import contract from 'truffle-contract';
import gameManager from '../../../solidity/build/contracts/GameManager.json';

import getWeb3 from './getWeb3';

import { GAME_MANAGER_ADDRESS } from './config';


class Main extends Component {

	constructor() {
		super();
		this.state = {
			isReady: false,
		};
	}

	async componentDidMount() {
		await getWeb3();

		window.web3.eth.getAccounts(async (err, acc) => {
			window.account = acc[0];

			await this.setupContracts();

			this.setState({
				isReady: true
			});
		});
	}

	async setupContracts() {
        const gameManagerContract = contract(gameManager);
        gameManagerContract.setProvider(window.web3.currentProvider);

        try {
            const gameManagerInstance = await gameManagerContract.at(GAME_MANAGER_ADDRESS);
            
            window.gameManagerInstance = gameManagerInstance;

        } catch(err) {
            console.log(err);
        }
    }

	render() {

		const { isReady } = this.state;

		return (
			isReady && 
			<Router>
				<Lobby path="/" />
				<FinishedGame path="/end" />
			</Router>
		);
	} 
}

render(<Main />, document.body);