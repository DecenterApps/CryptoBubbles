pragma solidity ^0.4.11;

import "./GameToken.sol";

contract GameManager {

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    event GameJoined(address indexed user, uint numTokens, uint playerPos);

    uint32[] gameBalances;
    uint public currPlayerIndex;
    mapping (uint => address) userPosition;
    mapping (address => bool) usersInGame;

    mapping (address => uint) public balances;
    
    mapping (address => bool) public hasVoted;

    address public owner;
    GameToken public gameToken;

    bytes32 public currStateHash;
    uint public numStateVerified;
    bool public gameInProgress;
    bool public callTheServer;
    bool public playersVoted;

    uint ONE_PLAY = 1000;
    uint FEE = 200;
    uint MIN_PLAYERS = 5;
    uint MAX_PLAYERS = 25;

    function GameManager(address gameTokenAddress) public {
        owner = msg.sender;
        gameToken = GameToken(gameTokenAddress);
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;

        currPlayerIndex = 0;
    }

    // Notice: for this call to execute we must first call .approve() 
    // in gameToken contract, so that our contract can spend it
    // CAP the num of players
    function joinGame(uint32 numTokens) public {
        // A user must submit some fixed num. of tokens to join the game
        require(numTokens > (ONE_PLAY + FEE));

        // A user can't enter a game while the game is ongoing
        require(gameInProgress == false);

        // A user can't enter a game twice with the same address
        require(usersInGame[msg.sender] == false);

        // We can't have more than 25 players?
        require(currPlayerIndex <= 25);

        // Transfer the tokens to the address of this contract
        gameToken.transferFrom(msg.sender, this, numTokens);

        // we stake the players tokens, and save it in an array
        gameBalances.push(numTokens);

        // remember which position in the array did the player get
        userPosition[currPlayerIndex] = msg.sender;

        // remember that the player has joined the current game
        usersInGame[msg.sender] = true;

        // Update the current position in the array
        currPlayerIndex++;
        
        // trigger game start if we reached the required num. of players
        if (currPlayerIndex >= MIN_PLAYERS) {
            gameInProgress = true;
        }
        
        GameJoined(msg.sender, numTokens, currPlayerIndex);
    }

    // What happens if some of the players don't vote??
    function gameEnds(uint32[] state, uint position) public {
        // The msg.sender is sending us the position where he is
        require(userPosition[position] == msg.sender);

        // The persone who votes, must be one of the players
        require(usersInGame[msg.sender] == true);

        // A player can vote only once
        require(hasVoted[msg.sender] == false);
        
        bytes32 stateHash = keccak256(state);
        
        if (currStateHash == 0x0) {
            currStateHash = stateHash;
            return;
        } 
        
        if (currStateHash == stateHash) {
            
            numStateVerified++;
            hasVoted[msg.sender] = true;

            // The last one
            if (numStateVerified >= currPlayerIndex) {
                playersVoted = true;
                submitState(state);
            }
        } else {
            // Bad stuff somone is cheating, server will punish the cheater and give the money to the poor
            callTheServer = true;
        }
    }


    function submitState(uint32[] state) internal {
        require(playersVoted == true);
        
        for(uint i = 0; i < currPlayerIndex; ++i) {
            balances[userPosition[i]] += state[i];
        }

        newGameSession();
    }

    function withdrawWins() public {
        require(balances[msg.sender] > 0);

        gameToken.transfer(msg.sender, balances[msg.sender]);
    }
    
    function newGameSession() internal {
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;

        currPlayerIndex = 0;
    }

    // FOR TESTING PURPOSES

    function changeFee(uint newFee) public onlyOwner {
        FEE = newFee;
    }
    
    function changeMinPlayers(uint _MIN_PLAYERS) public onlyOwner {
        MIN_PLAYERS = _MIN_PLAYERS;
    }
    
    function changeTokenAddress(address _tokenAddress) public onlyOwner {
        gameToken = GameToken(_tokenAddress);
    }
    
    function resetGame() public onlyOwner {
        newGameSession();
    }

    function startGame() public onlyOwner {
        gameInProgress = true;
    }
    
}