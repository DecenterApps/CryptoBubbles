import Web3 from 'web3';
import gameManagerAbi from '../../../../solidity/build/contracts/GameManager';

const web3 = new Web3(window.web3.currentProvider);

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0x3da2ce9724a918029ce1b8281274ec110277c4ff');

async function submitScoreState(state, position) {
    try {
        const userAddr = getUserAccount();
        const res = await gameManager.gameEnds(state, position, {from: userAddr});

        console.log("State added", res);

    } catch(err) {
        console.log(err);
    }
}

function getUserAccount() {
    return web3.eth.accounts[0];
}

module.exports = {
    getUserAccount,
    submitScoreState,
};