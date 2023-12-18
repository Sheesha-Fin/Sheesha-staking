// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20D6Mock is ERC20 {
    constructor(string memory symbol) ERC20(symbol, symbol) {
        _mint(msg.sender, 1e16);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
