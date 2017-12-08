import { h, render } from 'preact';
import Router from 'preact-router';
import Lobby from './lobby.jsx';


const Main = () => (
	<Router>
		<Lobby path="/" />
		{/* <About path="/about" /> */}

	</Router>
);

render(<Main />, document.querySelector('#content'));