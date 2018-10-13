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
        
    constructor(uint _minimumPrice) contractMinimumPrice(_minimumPrice) {
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
    
    function deleteCar(uint _index) {
        OwnershipStruct memory ownership = ownershipStructs[_index];
        
        require(msg.sender == ownership.owner);
        
        delete cars[_index];
        delete ownershipStructs[_index];
    }
    
    function setMinimumPrice(uint _minimumPrice) public payable {
        require(_minimumPrice>0.5 ether);
        require(msg.sender == admin);
        
        minimumPrice=_minimumPrice;
    }
    
    function takeOverCar(uint _index) public payable{
        OwnershipStruct storage ownership = ownershipStructs[_index];
        uint paid = ownership.price;
        
        require(msg.value >= 2*paid);
        require(msg.sender != ownership.owner);
        
        // transfer the money to the old owner
        uint difference = msg.value - paid;
        ownership.owner.transfer(paid + difference/2);
        
        // set the new owner
        ownership.owner = msg.sender;
        ownership.price = msg.value;
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }
}
