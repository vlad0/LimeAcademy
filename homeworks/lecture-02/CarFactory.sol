pragma solidity ^0.4.24;

contract CarFactory {

    event LogCarBought(uint, address, uint, string );
    uint public minimumPrice;
    address admin;
    string[] public cars;
    mapping(uint => OwnershipStruct) public ownershipStructs;
    mapping(address => uint[]) public allOwnedCars;
    
    modifier contractMinimumPrice(uint _minimumPrice) {
        require(_minimumPrice>0.5 ether);
        _;
    }

    modifier isAdmin() {
        require(msg.sender == admin);
        _;
    }
            
    constructor(uint _minimumPrice) public contractMinimumPrice(_minimumPrice) {
        minimumPrice = _minimumPrice;
        admin = msg.sender;
    }
    
    struct OwnershipStruct {
        address owner;
        uint256 price;
        string makeModel;
    }
    
    function buyCar(string _makeModel) public payable {
        require(msg.value >= minimumPrice);
        
        // .push() returns the new length;
        uint index = cars.push(_makeModel)-1;
        OwnershipStruct memory ownership = OwnershipStruct(msg.sender, msg.value, _makeModel);
        
        // set the ownership
        ownershipStructs[index] = ownership;
        
        // save the all cars owned by someone
        allOwnedCars[msg.sender].push(index);
        
        emit LogCarBought(index, ownership.owner, ownership.price, ownership.makeModel);
    }
    
    function deleteCar(uint _index) public {
        OwnershipStruct memory ownership = ownershipStructs[_index];
        
        require(msg.sender == ownership.owner);
        
        delete cars[_index];
        delete ownershipStructs[_index];
        removeCarFromOwner(_index, ownership.owner);
    }
    
    function getCarDetails(uint _index) public view returns(address, uint, string) {
        return (ownershipStructs[_index].owner, ownershipStructs[_index].price, ownershipStructs[_index].makeModel);
    }
    
    function takeOverCar(uint _index) public payable{
        OwnershipStruct storage ownership = ownershipStructs[_index];
        uint paid = ownership.price;
        
        require(msg.value >= 2*paid, "Value should be more than twice the original price");
        require(msg.sender != ownership.owner, "Owner should be different");
        
        // transfer the money to the old owner
        uint difference = msg.value - paid;
        ownership.owner.transfer(paid + difference/2);
        removeCarFromOwner(_index, ownership.owner);
        
        // set the new owner
        ownership.owner = msg.sender;
        ownership.price = msg.value;
    }
    
    function removeCarFromOwner(uint _carIndex, address previousOwner) private {
        uint elementIndex;
        bool found = false;
        uint[] storage allCars = allOwnedCars[previousOwner];
        for  (uint256 i = 0; i < allCars.length; i++) {
            if(allCars[i] == _carIndex) {
                found=true;
                elementIndex=i;
                break;
            }
        }

        require(found);
        
        // remove the car from owner's list
        // order doesn't matter
        uint lastItem = allCars[allCars.length-1];
        allCars[allCars.length-1] = allCars[elementIndex];
        allCars[elementIndex] = lastItem;
        delete allCars[allCars.length-1];
        allCars.length--;
    }
    
    function getCarsByOwner(address _owner) public view returns(uint){
        return allOwnedCars[_owner].length;
    }
    
    // ***************************
    // ********** ADMIN **********
    // ***************************
    function setMinimumPrice(uint _minimumPrice) public isAdmin contractMinimumPrice(_minimumPrice) {
        minimumPrice=_minimumPrice;
    }
    
    function withdraw() public isAdmin {
        admin.transfer(address(this).balance);
    }
    
    function getBalance() public view returns(uint) {
        return address(this).balance;
    }
}
