import { h, render, Component } from 'preact';
import "./lobby.css";

import Web3 from 'web3'
import Notifications, {notify} from 'react-notify-toast';

import getWeb3 from './getWeb3';
import socketHelper from './socketHelper';
import { GAME_MANAGER_ADDRESS, ENTRY_PRICE } from './config';

import LoadingGif from './loading.gif';

class Lobby extends Component {

    constructor(props) {
        super(props);

        this.state = {
            web3: null,
            address: "",
            joinedUsers: [],
            numPlayers: 0,
            round: 0,
            isAdmin: false,
            playersName: '',
            gameInProgress: false,
            alreadyJoined: false,
            isLoading: false,
            loadingText: 'Please wait while the transaction is being mined',
            inputError: ''
        };

        this.joinGame = this.joinGame.bind(this);
        this.onInputChange = this.onInputChange.bind(this);
        this.manualStart = this.manualStart.bind(this);
        this.resetGame = this.resetGame.bind(this);

        this.listeningOnSockets();
    }

    async componentWillMount() {

        this.setState({
            web3: window.web3,
            address: window.account,
            isAdmin: this.isAdmin(window.account),
        });

        this.socket.emit('get-users', window.account);

        await this.getNumPlayers();
    }

    //helper function
    isAdmin(address) {
        return (address === "0x93cdb0a93fc36f6a53ed21ecf6305ab80d06beca")
            || (address === "0x627306090abab3a6e1400e9345bc60c78a8bef57");
    }

    async getNumPlayers() {
        const res = await window.gameManagerInstance.currPlayerIndex();
        
        this.setState({
            numPlayers: res.valueOf()
        });
    }

    async manualStart() {
        try {

            this.socket.emit('game-starting');

            await window.gameManagerInstance.startGame({from: web3.eth.accounts[0]});

            console.log("Starting game...");

            this.socket.emit('start-game');

        } catch(err) {
            console.log(err);
        }
    }

    async resetGame() {
        try {

            await window.gameManagerInstance.resetGame({from: web3.eth.accounts[0]});

            console.log("reset");

            this.socket.emit('reset');

            window.location.href = '/';

        } catch(err) {
            console.log(err);
        }
    }

    async joinGame() {

        const managerInstance = window.gameManagerInstance;

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

            const res = await managerInstance.joinGame({from: web3.eth.accounts[0], value: ENTRY_PRICE});
            
            const event = res.logs[0];

            const newUser = {
                address: event.args.user,
                userName: this.state.playersName,
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
            console.log('ERR: ', err);
        }
    }

    onInputChange(event) {

        const name = event.target.name;
        const value = event.target.value;

        this.setState({
           [name]: value 
        });
    }

    listeningOnSockets() {
        this.socket = socketHelper();

        this.socket.on('game-started', () => {
            console.log("Game started");
            localStorage.setItem('score', JSON.stringify(this.state.joinedUsers));
            window.location.href = 'game.html';
        });

        this.socket.on('load-users', (users, gameInProgress) => {
            const currUser = users.find(u => u.address === this.state.address);

            console.log('Loading users');

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
                <div> - Round #{ this.state.round } </div>
            </div>
            <div>
                <div className="col-md-6 col-xs-6 follow line" align="center">
                    <h3>
                        {this.state.numPlayers}/5 <br/> <span>People joined</span>
                    </h3>
                </div>
                <div className="col-md-6 col-xs-6 follow line" align="center">
                    <h3>
                         0.01 ETH<br/> <span>Required for entry</span>
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
                         <button className="btn btn-orange" onClick={ this.joinGame } disabled={ this.state.alreadyJoined }>
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
                            - {user.userName}
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