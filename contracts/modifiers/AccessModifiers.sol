// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../errors/LandErrors.sol";

abstract contract AccessModifiers {
    // Implementing contracts must provide registrar via `_registrar()`.
    function _registrar() internal view virtual returns (address);

    modifier onlyRegistrar() {
        if (msg.sender != _registrar()) {
            revert Unauthorized();
        }
        _;
    }
}
