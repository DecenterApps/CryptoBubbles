const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const gameManagerAbi = require('../solidity/build/contracts/GameManager');

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0xcc79a2b2c22741dcb5188c8e7b6ba613a4f36221');

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