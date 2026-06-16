// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../enums/LandStatus.sol";

struct Land {
    uint256 id;
    string title;
    string location;
    uint256 size;
    uint256 ownerId;
    uint256 price;
    LandStatus status;
    bool exists;
}