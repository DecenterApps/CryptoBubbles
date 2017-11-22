const GameToken = artifacts.require("./GameToken.sol");
const GameManager = artifacts.require("./GameManager.sol");

module.exports = function(deployer, network) {
    deployer.deploy(GameToken, () => {
        return deployer.deploy(GameManager, GameToken.address);
    });
};