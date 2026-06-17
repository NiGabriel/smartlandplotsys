// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./storage/LandEscrowStorage.sol";
import "./modifiers/AccessModifiers.sol";
import "./models/User.sol";
import "./enums/UserRole.sol";
import "./errors/LandErrors.sol";
import "./models/Land.sol";
import "./enums/LandStatus.sol";
import "./enums/TransactionStatus.sol";
import "./models/Transaction.sol";
import "./interfaces/IEvents.sol";

contract LandSaleEscrow is LandEscrowStorage, AccessModifiers, IEvents {
    constructor() {
        // msg.sender is the deployer of the contract, which we consider as the registrar.
        registrar = msg.sender;
    }

    function _registrar() internal view override returns (address) {
        return registrar;
    }

    function registerUser(
        string memory fullName,
        address wallet,
        UserRole role
    ) public onlyRegistrar {
        if (bytes(fullName).length == 0) {
            revert InvalidData();
        }

        if (wallet == address(0)) {
            revert InvalidAddress();
        }

        if (walletToUserId[wallet] != 0) {
            revert InvalidData();
        }

        nextUserId++;

        users[nextUserId] = User({
            id: nextUserId,
            fullName: fullName,
            wallet: wallet,
            role: role,
            exists: true
        });

        walletToUserId[wallet] = nextUserId;
        userIds.push(nextUserId);

        emit UserRegistered(nextUserId, wallet);
    }

    function registerLand(
        string memory title,
        string memory location,
        uint256 size,
        uint256 ownerId
    ) public onlyRegistrar {
        if (ownerId == 0 || !users[ownerId].exists) {
            revert UserNotFound();
        }

        nextLandId++;

        lands[nextLandId] = Land({
            id: nextLandId,
            title: title,
            location: location,
            size: size,
            ownerId: ownerId,
            price: 0,
            status: LandStatus.Registered,
            exists: true
        });

        landIds.push(nextLandId);

        emit LandRegistered(nextLandId, ownerId);
    }

    function listLand(uint256 landId, uint256 price) public {
        if (!lands[landId].exists) revert LandNotFound();
        uint256 ownerId = walletToUserId[msg.sender];
        if (ownerId == 0) revert UserNotFound();
        if (lands[landId].ownerId != ownerId) revert Unauthorized();

        lands[landId].price = price;
        lands[landId].status = LandStatus.Listed;

        emit LandListed(landId, price);
    }

    function listLandForSale() public view returns (Land[] memory) {
        uint256 count = 0;

        // First pass: count listed lands
        for (uint256 i = 0; i < landIds.length; i++) {
            if (lands[landIds[i]].status == LandStatus.Listed) {
                count++;
            }
        }

        // Prepare result array
        Land[] memory result = new Land[](count);
        uint256 index = 0;

        // Second pass: collect listed lands
        for (uint256 i = 0; i < landIds.length; i++) {
            Land storage land = lands[landIds[i]];

            if (land.status == LandStatus.Listed) {
                result[index] = land;
                index++;
            }
        }

        return result;
    }

    function getOwnLands(uint256 userId) public view returns (Land[] memory) {
        uint256 count = 0;

        // First pass: count listed lands
        for (uint256 i = 0; i < landIds.length; i++) {
            if (lands[landIds[i]].ownerId == userId) {
                count++;
            }
        }

        // Prepare result array
        Land[] memory result = new Land[](count);
        uint256 index = 0;

        // Second pass: collect listed lands
        for (uint256 i = 0; i < landIds.length; i++) {
            Land storage land = lands[landIds[i]];

            if (land.status == LandStatus.Listed) {
                result[index] = land;
                index++;
            }
        }

        return result;
    }

    function initiatePurchase(uint256 landId) public returns (uint256) {
        if (!lands[landId].exists) revert LandNotFound();
        if (lands[landId].status != LandStatus.Listed) revert InvalidData();

        uint256 buyerId = walletToUserId[msg.sender];
        if (buyerId == 0) revert UserNotFound();

        nextTransactionId++;
        uint256 txId = nextTransactionId;

        transactions[txId] = TransactionRecord({
            id: txId,
            landId: landId,
            sellerId: lands[landId].ownerId,
            buyerId: buyerId,
            amount: lands[landId].price,
            timestamp: block.timestamp,
            status: TransactionStatus.Created
        });

        transactionIds.push(txId);

        emit PurchaseInitiated(txId, landId, buyerId);
        return txId;
    }

    function payForTransaction(uint256 transactionId) public payable {
        TransactionRecord storage tr = transactions[transactionId];
        if (tr.id == 0) revert InvalidData();
        if (tr.status != TransactionStatus.Created) revert InvalidData();
        if (walletToUserId[msg.sender] != tr.buyerId) revert Unauthorized();
        if (msg.value != tr.amount) revert InvalidData();

        tr.status = TransactionStatus.Funded;

        emit PaymentFunded(transactionId, msg.value);
    }

    function approveSale(uint256 transactionId) public onlyRegistrar {
        TransactionRecord storage tr = transactions[transactionId];
        if (tr.id == 0) revert InvalidData();
        if (tr.status != TransactionStatus.Funded) revert InvalidData();

        tr.status = TransactionStatus.Approved;

        emit SaleApproved(transactionId);
    }

    function finalizeTransaction(uint256 transactionId) public onlyRegistrar {
        TransactionRecord storage tr = transactions[transactionId];
        if (tr.id == 0) revert InvalidData();
        if (tr.status != TransactionStatus.Approved) revert InvalidData();

        // transfer funds to seller
        address sellerWallet = users[tr.sellerId].wallet;
        uint256 amount = tr.amount;

        tr.status = TransactionStatus.Completed;

        // change ownership
        uint256 prevOwner = lands[tr.landId].ownerId;
        lands[tr.landId].ownerId = tr.buyerId;
        lands[tr.landId].status = LandStatus.Sold;

        (bool sent, ) = payable(sellerWallet).call{value: amount}("");
        require(sent, "Transfer failed");

        emit TransferCompleted(transactionId, tr.landId, prevOwner, tr.buyerId);
    }

    function reverseTransaction(uint256 transactionId) public onlyRegistrar {
        TransactionRecord storage tr = transactions[transactionId];
        if (tr.id == 0) revert InvalidData();
        if (
            tr.status != TransactionStatus.Funded &&
            tr.status != TransactionStatus.Approved
        ) revert InvalidData();

        // refund buyer
        address buyerWallet = users[tr.buyerId].wallet;
        uint256 amount = tr.amount;

        tr.status = TransactionStatus.Cancelled;

        (bool sent, ) = payable(buyerWallet).call{value: amount}("");
        require(sent, "Refund failed");

        // restore land status to Listed
        lands[tr.landId].status = LandStatus.Listed;

        emit TransactionReversed(transactionId);
    }

    function getTransaction(
        uint256 transactionId
    ) public view returns (TransactionRecord memory) {
        TransactionRecord memory tr = transactions[transactionId];
        if (tr.id == 0) revert InvalidData();
        return tr;
    }

    function getUser(uint256 userId) public view returns (User memory) {
        if (!users[userId].exists) {
            revert UserNotFound();
        }

        return users[userId];
    }

    function getLand(uint256 landId) public view returns (Land memory) {
        if (!lands[landId].exists) {
            revert LandNotFound();
        }

        return lands[landId];
    }
}
