// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEvents {

    event UserRegistered(
        uint256 indexed userId,
        address indexed wallet
    );

    event LandRegistered(
        uint256 indexed landId,
        uint256 indexed ownerId
    );

    event LandListed(
        uint256 indexed landId,
        uint256 price
    );

    event PurchaseInitiated(
        uint256 indexed transactionId,
        uint256 indexed landId,
        uint256 indexed buyerId
    );

    event PaymentFunded(
        uint256 indexed transactionId,
        uint256 amount
    );

    event SaleApproved(
        uint256 indexed transactionId
    );

    event TransferCompleted(
        uint256 indexed transactionId,
        uint256 indexed landId,
        uint256 fromOwnerId,
        uint256 toOwnerId
    );

    event TransactionReversed(
        uint256 indexed transactionId
    );
}
