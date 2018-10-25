const etherlime = require('etherlime');
const carFactory = require('../build/CarFactory.json')
const ethers = require('ethers');

describe('CarFactory', () => {
    let owner = accounts[0];
    let secondOwner = accounts[1];
    let secondContract;
    let deployer;
    let contract;
    let initialMinimumPrice = '0.51';
    let initialCarName = 'eCar';

    beforeEach(async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(owner.secretKey);

        const result = await deployer.deploy(carFactory, {}, ethers.utils.parseEther(initialMinimumPrice));
        contract = result.contract;

        const secondWallet = new ethers.Wallet(secondOwner.secretKey, deployer.provider);
        secondContract = new ethers.Contract(contract.address, carFactory.abi, secondWallet);
    });
    it.skip('should set owner of the contract', async () => {
        const contractOwner = await contract.getOwner();
        assert.strictEqual(contractOwner, owner.wallet.address);
    });

    it.skip('should set minimum price', async () => {
        const minimumPrice = await contract.minimumPrice();
        const expectedMinimumPrice = ethers.utils.parseEther(initialMinimumPrice);
        assert(minimumPrice.eq(expectedMinimumPrice));
    });

    it.skip('should fail if initial minimum price is <= 0.5', async () => {
        const minimumPrice = '0.5'; // eth
        assert.revert(deployer.deploy(carFactory, {}, ethers.utils.parseEther(minimumPrice)));
    });

    it.skip('should buy car successfully', async () => {
        const result = await contract.buyCar(initialCarName, { value: ethers.utils.parseEther(initialMinimumPrice) });
        assert.isOk(result);
    });

    it.skip('should fail when buying a car at lower price', async () => {
        await assert.revert(contract.buyCar(initialCarName, { value: ethers.utils.parseEther('0.50') }));
    });

    describe('Buy Car', async () => {
        let result;
        beforeEach(async () => {
            result = await contract.buyCar(initialCarName, { value: ethers.utils.parseEther(initialMinimumPrice) });
            assert.isOk(result);
        });

        it('should add a car to ownershipStruct', async () => {
            const ownership = await contract.ownershipStructs(0);
            assert.strictEqual(ownership.makeModel, initialCarName)
        });

        it('should fail when car price is below minim price', async () => {
            await assert.revert(contract.buyCar(initialCarName, { value: ethers.utils.parseEther('0.50') }));
        });

        it('should store the correct price at ownershipStruct', async () => {
            const ownership = await contract.ownershipStructs(0);
            assert(ownership.price.eq(ethers.utils.parseEther(initialMinimumPrice)), 'Car price doesn\'t meet the initial value:. Ownership price: ' + ethers.utils.formatEther(ownership.price.toString()));
        });

        it('should have the contract balance updated', async () => {
            const contractBalance = await contract.getBalance();
            assert(contractBalance.eq(ethers.utils.parseEther(initialMinimumPrice)),
                'Contract balance is not correct:. Contract balance: ' + ethers.utils.formatEther(contractBalance.toString()));
        });

        it('should raise a LogCarBought event', async () => {
            let txReceipt = await deployer.provider.getTransactionReceipt(result.hash);

            let isEmitted = utils.hasEvent(txReceipt, contract, 'LogCarBought1');
            assert(isEmitted, 'Event LogCarBought not emitted');
        });
    })
});