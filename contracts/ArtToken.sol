// SPDX-License-Identifier: Adilbekk
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ArtToken is ERC20 {
    address public minter;

    constructor() ERC20("ArtLaunch Token", "ART") {
        minter = msg.sender;
    }
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only ArtLaunch can mint");
        _mint(to, amount);
    }
    function setMinter(address _newMinter) external {
        require(msg.sender == minter, "Not authorized");
        minter = _newMinter;
    }
}