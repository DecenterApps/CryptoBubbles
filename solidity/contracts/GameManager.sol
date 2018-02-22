pragma solidity ^0.4.18;

contract GameManager {

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
    
    modifier onlyServer {
        require(msg.sender == server);
        _;
    }
    
    event GameJoined(uint indexed rounds, address indexed user, uint playerPos);
    event GameStarted(uint indexed rounds, address byWhom, uint numPlayers, uint timestamp);
    event GameFinalized(uint indexed rounds, address user, uint numPlayers);
    event Voted(uint indexed rounds, address user, bytes32 currStateHash, bytes32 newStateHash, uint currPlayer, uint numVoted);
    event ServerNeeded();

    uint public currPlayerIndex;
    mapping (uint => address) public userPosition;
    mapping (address => bool) public usersInGame;

    mapping (address => uint) public balances;
    
    mapping (address => bool) public hasVoted;

    address public owner;

    bytes32 public currStateHash;
    uint public numStateVerified;
    bool public gameInProgress;
    bool public callTheServer;
    bool public playersVoted;
    
    uint public creationTime;
    address public server;
    
    uint public submitStateStartTime;
    uint public numGamesPlayed;
    
    uint public rounds;

    uint VOTE_PERIOD = 5 minutes;
    uint32 ONE_PLAY = 1000;
    uint FEE = 200;
    uint MIN_PLAYERS = 5;
    uint MAX_PLAYERS = 25;
    uint PRICE_TO_ENTER = 10 ** 15;

    function GameManager() public {
        owner = msg.sender;
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;
        creationTime = now;

        currPlayerIndex = 0;
        rounds = 0;
    }
    
    function joinGame() public payable {
        require(msg.value >= PRICE_TO_ENTER);
        
         // A user can't enter a game while the game is ongoing
        require(gameInProgress == false);
    
        // A user can't enter a game twice with the same address
        require(usersInGame[msg.sender] == false);
    
        // We can't have more than 25 players?
        require(currPlayerIndex <= 25);
        
        // remember which position in the array did the player get
        userPosition[currPlayerIndex] = msg.sender;
    
        usersInGame[msg.sender] = true;
    
        // Update the current position in the array
        currPlayerIndex++;
        
        // trigger game start if we reached the required num. of players
        if (currPlayerIndex >= MIN_PLAYERS) {
            gameInProgress = true;
            GameStarted(rounds, msg.sender, currPlayerIndex, now);
        }
        
        GameJoined(rounds, msg.sender, currPlayerIndex); 
    }

    // What happens if some of the players don't vote??
    function gameEnds(uint32[] state, uint position) public {
        // The msg.sender is sending us the position where he is
        require(userPosition[position] == msg.sender);

        // The person who votes, must be one of the players
        require(usersInGame[msg.sender] == true);

        // TODO: figure out how to reset this check on game end
        // A player can vote only once
        //require(hasVoted[msg.sender] == false);
        
        bytes32 stateHash = keccak256(state);

        Voted(rounds, msg.sender, currStateHash, stateHash, currPlayerIndex, numStateVerified);
        
        // we remove the user from game, so he can join in the next one
        usersInGame[msg.sender] = false;
        
        if (currStateHash == 0x0) {
            currStateHash = stateHash;
            submitStateStartTime = now;
            numStateVerified++;
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
            // gameToken.transfer(msg.sender, REWARD_FOR_FINALIZE);
            
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
            usersInGame[userPosition[i]] = false;
        }
        
        numGamesPlayed++;
        
        GameFinalized(rounds, msg.sender, currPlayerIndex);

        newGameSession();
    }

    function withdrawWins() public {
        require(balances[msg.sender] > 0);

        msg.sender.transfer(balances[msg.sender]);
    }
    
    function newGameSession() internal {
        gameInProgress = false;
        playersVoted = false;
        callTheServer = false;
        numStateVerified = 0;
        currPlayerIndex = 0;

        currStateHash = 0x0;
        
        rounds++;
        
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
    
    function resetGame() public onlyOwner {
        
        usersInGame[msg.sender] = false;
        
        for(uint i = 0; i < currPlayerIndex; ++i) {
            usersInGame[userPosition[i]] = false;
        }
        
        newGameSession();
    }

    function startGame() public onlyOwner {
        gameInProgress = true;
        GameStarted(rounds, msg.sender, currPlayerIndex, now);
    }
    
}