import { h, render } from 'preact';
import Router from 'preact-router';
import Lobby from './lobby.jsx';
import FinishedGame from './finishedGame.jsx';


const Main = () => (
	<Router>
		<Lobby path="/" />
		<FinishedGame path="/end" />
	</Router>
);

render(<Main />, document.body);