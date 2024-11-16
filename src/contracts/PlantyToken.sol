// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PlantyToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        address plantManager,
        uint256 plantManagerSupply,
        address admin,
        uint256 adminSupply
    ) ERC20(name, symbol) {
        _mint(plantManager, plantManagerSupply);
        _mint(admin, adminSupply);
    }
}
