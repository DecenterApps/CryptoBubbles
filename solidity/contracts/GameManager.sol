pragma solidity ^0.4.11;

import "./GameToken.sol";

contract GameManager {

    modifier onlyCurrentPlayer {
        require(games[currGameSession].gameBalances[msg.sender] > 0);
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    struct GameSession {
        mapping (address => uint) gameBalances;
        uint numPlayers;
    }

    struct GameState {
        address user;
        uint256 score;
    }

    mapping (uint => GameSession) games;
    mapping (address => uint) public balances;

    address public owner;
    GameToken public gameToken;

    bytes32 public currStateHash;
    uint public currGameSession;
    uint public numStateVerified;
    bool public gameInProgress;
    bool public callTheServer;
    bool public playersVoted;

    uint ONE_PLAY = 1000;
    uint FEE = 200;
    uint MIN_PLAYERS = 5;

    function GameManager(address gameTokenAddress) public {
        currGameSession = 0;
        owner = msg.sender;
        gameToken = GameToken(gameTokenAddress);
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;

        games[currGameSession] = GameSession({
            numPlayers: 0
        });
    }

    // before call the user has to approve the tokens to be spent
    function joinGame(address user, uint numTokens) public {
        require(numTokens > ONE_PLAY + FEE);
        require(gameInProgress == false);

        gameToken.transferFrom(user, this, numTokens);

        games[currGameSession].gameBalances[user] = numTokens;
        games[currGameSession].numPlayers++;
    }

    // WHO CALLS this?
    function startGame() public {
        require(games[currGameSession].numPlayers >= MIN_PLAYERS);

        gameInProgress = true;
    }

    // Called by each user who plays in the current game
    // This is an approach where the users send a hash of the state,
    // And after someone submits the acctuall state matching the hash this is to save money
    // on TX, different approach is to thightly pack the state and save that way

    //BUG: what is one user that is a player spams with his state (limit to 1 vote per user)
    function gameEnds(bytes32 stateHash) public onlyCurrentPlayer {
        if (currStateHash == 0x0) {
            currStateHash = stateHash;
        } else {
            if (currStateHash == stateHash) {
                numStateVerified++;

                // The last one
                if( numStateVerified == games[currGameSession].numPlayers) {
                    playersVoted = true;
                }
            } else {
                // Bad stuff somone is cheating, server will punish the cheater and give the money to the poor
                callTheServer = true;
            }
        }
    }

    // This is called by someone (server || some user) ?
    // Only when the state if verified by everyone in gameEnds
    // The user submits the state, probably better packed than this?
    function submitState(address[] users, uint[] scores) public {
        require(playersVoted == true && users.length == scores.length);
        
        GameState[] state;
        
        for (uint i = 0; i < users.length; ++i) {
            balances[users[i]] += scores[i];
            state[i] = GameState({
               user: users[i],
               score: scores[i]
            });
        }
        
        // sha3(state);

        newGameSession();
    }

    function withdrawWins() public {
        require(balances[msg.sender] > 0);

        gameToken.transfer(msg.sender, balances[msg.sender]);
    }

    function changeFee(uint newFee) public onlyOwner {
        FEE = newFee;
    }

    function newGameSession() internal {
        currGameSession++;
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;

        games[currGameSession] = GameSession({
            numPlayers: 0
        });
    }
    
}