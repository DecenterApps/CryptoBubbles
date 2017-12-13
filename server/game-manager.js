const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const gameManagerAbi = require('../solidity/build/contracts/GameManager');

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0x5a082c7e7d01d358a49ddbb9f7407ccf4e452a87');

async function hasGameStarted() {
    try {
        const res = await gameManager.gameInProgress();
      
        return res;
    } catch(err) {
        console.log(err);
    }
}

function gameFinalized() {
    return new Promise((resolve, reject) => {

        gameManager.GameFinalized((err, res) => {
            if (err) {
                reject(err);
            }

            console.log(err, "fin");

            resolve(res);
        });

    });
}

function serverNeeded() {
    return new Promise((resolve, reject) => {
        
        gameManager.ServerNeeded((err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        });

    });
}

function userVoted() {
    return new Promise((resolve, reject) => {
        
        gameManager.Voted((err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        });

    });
}

module.exports = {
    hasGameStarted,
    gameFinalized,
    serverNeeded,
    userVoted,
};