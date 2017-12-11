pragma solidity ^0.4.11;

import "./GameToken.sol";

contract GameManager {

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyServer {
        require(msg.sender == server);
        _;
    }
    
    event GameJoined(address indexed user, uint numTokens, uint playerPos);
    event GameFinalized(address user, uint numPlayers);
    event Voted(address user, bytes32 stateHash);
    event ServerNeeded();

    uint32[] public gameBalances; //TODO: take care of overflows
    uint public currPlayerIndex;
    mapping (uint => address) public userPosition;
    mapping (address => bool) public usersInGame;

    mapping (address => uint) public balances;
    
    mapping (address => bool) public hasVoted;

    address public owner;
    GameToken public gameToken;

    bytes32 public currStateHash;
    uint public numStateVerified;
    bool public gameInProgress;
    bool public callTheServer;
    bool public playersVoted;
    
    uint public tokensGiven;
    uint public creationTime;
    address public server;
    
    uint submitStateStartTime;

    uint REWARD_FOR_FINALIZE = 2000; // 2000 GT
    uint VOTE_PERIOD = 5 minutes;
    uint32 ONE_PLAY = 1000;
    uint FEE = 200;
    uint MIN_PLAYERS = 5;
    uint MAX_PLAYERS = 25;

    function GameManager() public {
        owner = msg.sender;
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;
        tokensGiven = 0;
        creationTime = now;

        currPlayerIndex = 0;
    }
    
    // We want to reward the initial supporters of the game
    // There will be an initial token amount that is given
    // Token fee to play the game is paid by the contract
    // This can only be called 3 weeks after the contract creating
    // And if less than a million tokens have been given away
    function joinGameFree() public {
        require(tokensGiven < 1000000 && now < (creationTime + 3 weeks));
        
        enterGame(ONE_PLAY);
        
        tokensGiven += ONE_PLAY;
    }

    // Notice: for this call to execute we must first call .approve() 
    // in gameToken contract, so that our contract can spend it
    function joinGame(uint32 numTokens) public {
        // A user must submit some fixed num. of tokens to join the game
        require(numTokens > (ONE_PLAY + FEE));

        // Transfer the tokens to the address of this contract
        gameToken.transferFrom(msg.sender, this, numTokens);

        enterGame(numTokens);
    }
    
    function enterGame(uint32 numTokens) internal {
      // A user can't enter a game while the game is ongoing
        require(gameInProgress == false);

        // A user can't enter a game twice with the same address
        require(usersInGame[msg.sender] == false);

        // We can't have more than 25 players?
        require(currPlayerIndex <= 25);

        // we stake the players tokens, and save it in an array
        gameBalances.push(numTokens);
        
        // remember which position in the array did the player get
        userPosition[currPlayerIndex] = msg.sender;

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

        // The person who votes, must be one of the players
        require(usersInGame[msg.sender] == true);

        // A player can vote only once
        require(hasVoted[msg.sender] == false);
        
        bytes32 stateHash = keccak256(state);

        Voted(msg.sender, stateHash);
        
        // we remove the user from game, so he can join in the next one
        usersInGame[msg.sender] = false;
        
        if (currStateHash == 0x0) {
            currStateHash = stateHash;
            submitStateStartTime = now;
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
            ServerNeeded();
        }
    }

    // Call this if after n blocks not all players have voted
    // This will be callabale by anyone and we'll reward the player for the call
    function finalizeGame(uint32[] state) public {
        require(now >= (submitStateStartTime + VOTE_PERIOD));
        
        // TODO: check for rounding error && possible attacks
        // If majority of the verified has votes take that as true
        if (numStateVerified > (currPlayerIndex / 2)) {
            
            bytes32 stateHash = keccak256(state);
            
            // A user gave a wrong score 
            if(stateHash != currStateHash) {
                return;
            }
            
            submitState(state);
            
            // reward the player for calling this function
            gameToken.transfer(msg.sender, REWARD_FOR_FINALIZE);
            
        } else {
            // who you gonna call when a cheater appears?
            callTheServer = true;
            ServerNeeded();
        }
    }
    
    // Somebody tried the cheat the server will punish the bad 
    // and reward the good
    function judgment(uint32[] state) public onlyServer {
        require(callTheServer == true);
        
        submitState(state);
   
    }

    function submitState(uint32[] state) internal {
        require(playersVoted == true);
        
        for(uint i = 0; i < currPlayerIndex; ++i) {
            balances[userPosition[i]] += state[i];
        }
        
        GameFinalized(msg.sender, currPlayerIndex);

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
        delete gameBalances;

        currPlayerIndex = 0;
        tokensGiven;
    }
    
    function setGameToken(address gameTokenAddress) public onlyOwner {
        gameToken = GameToken(gameTokenAddress);
    }
    
    function isInPreSale() public constant returns(bool) {
        return tokensGiven < 1000000 && now < (creationTime + 3 weeks);
    }
    
    function setServer(address _server) public onlyOwner {
        server = _server;
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
        
        usersInGame[msg.sender] = false;
        
        for(uint i = 0; i < currPlayerIndex; ++i) {
            usersInGame[userPosition[i]] = false;
        }
    }

    function startGame() public onlyOwner {
        gameInProgress = true;
    }
    
}