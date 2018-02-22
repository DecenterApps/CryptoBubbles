import Web3 from 'web3'

const getWeb3 = async () => {
  if (typeof web3 !== 'undefined') {
    window.web3 = new Web3(web3.currentProvider); // eslint-disable-line
  }
};

export default getWeb3;

// export {
//   initWeb3,
//   managerInstance,
//   setManagerInstance,
// };