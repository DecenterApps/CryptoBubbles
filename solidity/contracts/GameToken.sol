pragma solidity ^0.4.11;

import "./StandardToken.sol";

contract GameToken is StandardToken {

    string public name = "GameToken"; 
    string public symbol = "GT";
    uint public decimals = 1;
    uint public INITIAL_SUPPLY = 100000000;

    uint TOKEN_IN_WEI = 10000000000000;

    function GameToken(address gameManagerAddr) public {
        totalSupply = INITIAL_SUPPLY;
        balances[this] = INITIAL_SUPPLY / 2;
        balances[gameManagerAddr] = INITIAL_SUPPLY / 2;
        
    }

}