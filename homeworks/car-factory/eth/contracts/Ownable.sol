pragma solidity ^0.4.24;

contract Ownable {
    address public _owner;

    constructor() public {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Sender is not owner");
        _;
    }

    function isOwner() public view returns(bool) {
        return msg.sender == _owner;
    }
}