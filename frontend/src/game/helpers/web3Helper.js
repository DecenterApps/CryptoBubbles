import Web3 from 'web3';
import gameManagerAbi from '../../../../solidity/build/contracts/GameManager';

const web3 = new Web3(window.web3.currentProvider);


// TODO: async
function getUserAccount() {
    return web3.eth.accounts[0];
}

module.exports = {
    getUserAccount,
};