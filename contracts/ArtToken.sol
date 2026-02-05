// SPDX-License-Identifier: Adil
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArtToken is ERC20 {
    address public minter;

    constructor() ERC20("ArtLaunch Token", "ART") {
        minter = msg.sender;
    }

    // позволяет только основному контракту чеканить токены 
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only ArtLaunch can mint");
        _mint(to, amount);
    }

    // передача прав на чеканку контракту ArtLaunch
    function setMinter(address _newMinter) external {
        require(msg.sender == minter, "Not authorized");
        minter = _newMinter;
    }
}