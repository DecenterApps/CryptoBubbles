const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const gameManagerAbi = require('../solidity/build/contracts/GameManager');

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0x7c9d887612cc88fc6c6e2f83d1e4fe2014ccb8f0');

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