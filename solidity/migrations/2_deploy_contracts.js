const GameToken = artifacts.require("./GameToken.sol");

module.exports = function(deployer, network) {
    deployer.deploy(GameToken);
};