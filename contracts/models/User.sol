// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../enums/UserRole.sol";

struct User {
    uint256 id;
    string fullName;
    address wallet;
    UserRole role;
    bool exists;
}