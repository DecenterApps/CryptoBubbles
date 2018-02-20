const Web3 = require('web3');

require('dotenv').config();

const LOCAL_NETWORK = "http://localhost:7545";
const KOVAN_NETWORK = "https://kovan.decenter.com";

const web3 = new Web3(new Web3.providers.HttpProvider(KOVAN_NETWORK));

const privateKey = Buffer.from(process.env.SERVER_PRIV_KEY, 'hex');
const ourAddress = process.env.SERVER_ADDRESS;

const gameManagerAbi = require('../solidity/build/contracts/GameManager');

const gameManager = web3.eth.contract(gameManagerAbi.abi).at(process.env.CONTRACT_ADDRESS);

let nonce = web3.eth.getTransactionCount(ourAddress);
const gasPrice = 102509001; // Magic

async function hasGameStarted() {
    try {
        const res = await gameManager.gameInProgress();
      
        return res;
    } catch(err) {
        console.log(err);
    }
}

async function testEvents() {
    try {

        const res = await gameManager.serverNeededEvent({from: ourAddress});
        
        gameManager.ServerNeeded((err, res) => {
            if (err) {
                console.log(err);
            }
        
            console.log(res);
        });

        console.log(res);
    } catch(err) {
        console.log(err);
    }
}

async function serverJudgement(state) {
    try {
        await sendTransaction(web3, gameManager.judgment, ourAddress, [state], gasPrice, web3.toHex(nonce));

    } catch(err) {
        console.log(err);
    }
}

function gameFinalized(callback) {
        gameManager.GameFinalized((err, res) => {
            console.log(err, "fin");

            callback(res);
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

function userJoined() {
    return new Promise((resolve, reject) => {
        
        gameManager.GameJoined((err, res) => {
            if (err) {
                reject(err);
            }

            resolve(res);
        });

    });
}

function gameStarted() {

}

// Helper functions

const sendTransaction = async (web3, contractMethod, from, params, _gasPrice, nonce) =>
    new Promise(async (resolve, reject) => {
        const privateKey = new Buffer(ourPrivateKey, 'hex');

        const { to, data } = getEncodedParams(contractMethod, params);

        const gasPrice = web3.toHex(_gasPrice);

        const gas = web3.toHex(300000);

        let transactionParams = { from, to, data, gas, gasPrice, nonce };

        const txHash = await sendRawTransaction(web3, transactionParams, privateKey);
        resolve(txHash);
});

const sendRawTransaction = (web3, transactionParams, privateKey) =>
    new Promise((resolve, reject) => {
        const tx = new EthereumTx(transactionParams);

        tx.sign(privateKey);

        const serializedTx = `0x${tx.serialize().toString('hex')}`;

        web3.eth.sendRawTransaction(serializedTx, (error, transactionHash) => {
            console.log("Err: ", error);
            if (error) reject(error);

            resolve(transactionHash);
        });
    });

module.exports = {
    hasGameStarted,
    gameFinalized,
    serverNeeded,
    userVoted,
    userJoined,
    gameStarted,
    serverJudgement,
    testEvents,
};