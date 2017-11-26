const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const gameManagerAbi = require('../solidity/build/contracts/GameManager');

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0x3da2ce9724a918029ce1b8281274ec110277c4ff');

async function hasGameStarted() {
    try {
        const res = await gameManager.gameInProgress();
      
        return res;
    } catch(err) {
        console.log(err);
    }
}

module.exports = {
    hasGameStarted,
};