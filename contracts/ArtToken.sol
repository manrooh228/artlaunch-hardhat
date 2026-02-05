// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArtToken is ERC20 {
    address public minter;

    constructor() ERC20("ArtLaunch Token", "ART") {
        minter = msg.sender;
    }

    // Позволяет только основному контракту чеканить токены [cite: 39, 42]
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only ArtLaunch can mint");
        _mint(to, amount);
    }

    // Передача прав на чеканку контракту ArtLaunch
    function setMinter(address _newMinter) external {
        require(msg.sender == minter, "Not authorized");
        minter = _newMinter;
    }
}