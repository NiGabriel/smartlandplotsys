// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../errors/LandErrors.sol";

contract AccessModifiers {

    address public registrar;

    modifier onlyRegistrar() {
        if (msg.sender != registrar) {
            revert Unauthorized();
        }
        _;
    }
}