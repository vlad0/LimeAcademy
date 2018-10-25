const etherlime = require('etherlime');
const carFactory = require('../build/CarFactory.json')
const ethers = require('ethers');

describe('Example', () => {
    let owner = accounts[0];
    let deployer;
    let contract;
    let initialMinimumPrice = '0.51';
    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);
        const result = await deployer.deploy(carFactory, {}, ethers.utils.parseEther(initialMinimumPrice));
        contract = result.contract;

    });

    it('should set owner of the contract', async () => {
        const contractOwner = await contract.getOwner();
        assert.strictEqual(contractOwner, owner.wallet.address);
    });

    it('should set minimum price', async () => {
        const minimumPrice = await contract.minimumPrice();
        const expectedMinimumPrice = ethers.utils.parseEther(initialMinimumPrice);
        assert(minimumPrice.eq(expectedMinimumPrice));
    });

    it('should fail if initial minimum price is <= 0.5', async () => {
        const minimumPrice = '0.5'; // eth
        assert.revert(deployer.deploy(carFactory, {}, ethers.utils.parseEther(minimumPrice)));
    });

    it('should buy car successfully', async () => {
        const result = await contract.buyCar("bmw", { value: ethers.utils.parseEther('0.51') });
        assert.isNotOk(result);
    });

    it('should fail when buying a car at lower price', async () => {
        await assert.revert(contract.buyCar('eCar', { value: ethers.utils.parseEther('0.50') }));
    });
});