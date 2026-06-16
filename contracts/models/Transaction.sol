// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../enums/TransactionStatus.sol";

struct TransactionRecord {
    uint256 id;
    uint256 landId;
    uint256 sellerId;
    uint256 buyerId;
    uint256 amount;
    uint256 timestamp;
    TransactionStatus status;
}
