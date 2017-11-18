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

        balances[msg.sender] = numTokens;
    }

    function withdrawEther(uint tokenAmount) public {
        require(balances[msg.sender] > (tokenAmount * TOKEN_IN_WEI));

        msg.sender.transfer(tokenAmount * TOKEN_IN_WEI);
    }

    /* Approves and then calls the receiving contract */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);

        //call the receiveApproval function on the contract you want to be notified. This crafts the function signature manually so one doesn't have to include a contract in here just for this.
        //receiveApproval(address _from, uint256 _value, address _tokenContract, bytes _extraData)
        //it is assumed when one does this that the call *should* succeed, otherwise one would use vanilla approve instead.
        require(_spender.call(bytes4(bytes32(keccak256("receiveApproval(address,uint256,address,bytes)"))), msg.sender, _value, this, _extraData));
        return true;
    }

}