const etherlime = require('etherlime');

const deploy = async (network, secret) => {

	const deployer = new etherlime.EtherlimeGanacheDeployer();
	const result = await deployer.deploy(LimeFactory);

};

module.exports = {
	deploy
};