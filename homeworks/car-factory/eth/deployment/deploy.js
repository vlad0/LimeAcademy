const etherlime = require('etherlime');
const CarFactory = require('../build/CarFactory.json')
const utils = require('ethers/utils')
const ethers = require('ethers');
// private keys
const infura = require('../_private/infura.json');
const config = require('../_private/config.json');

const deploy = async (network, secret) => {
	network = network || config.network;
	secret = secret || config.secret;
	const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, infura.key);
	const result = await deployer.deploy(
		CarFactory,
		{}, //no Solidity librarires
		utils.parseEther('0.51')
	);

	const contract = result.contract;
	const owner = await result.contract.getOwner();
	console.log('Owner: ', owner);

	const minimumPrice = await result.contract.minimumPrice();
	console.log('Minimum Price @ ETH: ', utils.formatEther((minimumPrice).toString()));

	// initialize Second Wallet
	const secondWallet = new ethers.Wallet(config.secret, deployer.provider);
	const secondContract = new ethers.Contract(contract.address, CarFactory.abi, secondWallet);

	const balance = await secondWallet.getBalance();
	console.log('Balance: ', utils.formatEther(balance.toString()));
	const tx = await secondContract.buyCar('eCar', 'IPFS URL', { value: utils.parseEther('0.51') });

	const carDetails = await contract.getCarDetails(0);
	console.log('Car details: ', carDetails);
};

module.exports = {
	deploy
};