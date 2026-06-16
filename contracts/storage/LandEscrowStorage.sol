// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../models/User.sol";
import "../models/Land.sol";
import "../models/Transaction.sol";

contract LandEscrowStorage {

    uint256 internal nextUserId;
    uint256 internal nextLandId;
    uint256 internal nextTransactionId;

    mapping(uint256 => User) internal users;
    mapping(uint256 => Land) internal lands;
    mapping(uint256 => TransactionRecord) internal transactions;

    mapping(address => uint256) internal walletToUserId;

    uint256[] internal landIds;
    uint256[] internal userIds;
    uint256[] internal transactionIds;

    address public registrar;
}