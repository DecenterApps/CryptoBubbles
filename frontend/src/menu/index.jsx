import { h, render } from 'preact';
import Router from 'preact-router';
import Lobby from './lobby.jsx';
import FinishedGame from './finishedGame.jsx';

import getWeb3 from './getWeb3';

class Main {

	async componentWillMount() {
		await getWeb3();
	}

	render() {
		return (
			<Router>
				<Lobby path="/" />
				<FinishedGame path="/end" />
			</Router>
		);
	} 
}

render(<Main />, document.body);