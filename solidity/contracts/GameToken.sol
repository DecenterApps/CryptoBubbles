pragma solidity ^0.4.11;

import "./StandardToken.sol";

contract GameToken is StandardToken {

    string public name = "GameToken"; 
    string public symbol = "GT";
    uint public decimals = 1;
    uint public INITIAL_SUPPLY = 100000000;

    uint TOKEN_IN_WEI = 10000000000000;

    function GameToken() public {
        totalSupply = INITIAL_SUPPLY;
        balances[this] = INITIAL_SUPPLY;
    }

    function buyTokens() public payable {
        require(msg.value > TOKEN_IN_WEI);

        uint numTokens = msg.value / TOKEN_IN_WEI;

        balances[msg.sender] += numTokens;
    }
    
    
    // TEST method
    function buyAndApprove(address gameManager) public payable {
        require(msg.value > TOKEN_IN_WEI);

        uint numTokens = msg.value / TOKEN_IN_WEI;

        balances[msg.sender] += numTokens;
        
        approve(gameManager, balances[msg.sender]);
    }

    function withdrawEther(uint tokenAmount) public {
        require(balances[msg.sender] > (tokenAmount * TOKEN_IN_WEI));

        msg.sender.transfer(tokenAmount * TOKEN_IN_WEI);
    }

}