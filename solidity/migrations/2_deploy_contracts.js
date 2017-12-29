const GameToken = artifacts.require("./GameToken.sol");
const GameManager = artifacts.require("./GameManager.sol");

module.exports = function(deployer, network) {
    deployer.deploy(GameManager).then(() => {
        return deployer.deploy(GameToken, GameManager.address);
    });
};