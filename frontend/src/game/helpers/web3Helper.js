import Web3 from 'web3';
import gameManagerAbi from '../../../../solidity/build/contracts/GameManager';

const web3 = new Web3(window.web3.currentProvider);

const gameManager = web3.eth.contract(gameManagerAbi.abi)
.at('0x3da2ce9724a918029ce1b8281274ec110277c4ff');

function submitScoreState(state, position, callback) {
        const userAddr = getUserAccount();

        gameManager.gameEnds(state, position, {from: userAddr}, (err, res) => {
            if(err) {
                console.log(err);
            }

            callback(res);
        });

}

function getUserAccount() {
    return web3.eth.accounts[0];
}

module.exports = {
    getUserAccount,
    submitScoreState,
};