// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./storage/LandEscrowStorage.sol";
import "./modifiers/AccessModifiers.sol";
import "./models/User.sol";
import "./enums/UserRole.sol";
import "./errors/LandErrors.sol";
import "./models/Land.sol";
import "./enums/LandStatus.sol";

contract LandSaleEscrow is LandEscrowStorage {
    event UserRegistered(uint256 userId, address wallet);
    event LandRegistered(uint256 landId, uint256 ownerId);

    constructor() {
        registrar = msg.sender;
    }

    function registerUser(string memory fullName, UserRole role) public {
        if (bytes(fullName).length == 0) {
            revert InvalidData();
        }

        if (msg.sender == address(0)) {
            revert InvalidAddress();
        }

        nextUserId++;

        users[nextUserId] = User({
            id: nextUserId,
            fullName: fullName,
            wallet: msg.sender,
            role: role,
            exists: true
        });

        walletToUserId[msg.sender] = nextUserId;
        userIds.push(nextUserId);

        emit UserRegistered(nextUserId, msg.sender);
    }

    function registerLand(
        string memory title,
        string memory location,
        uint256 size
    ) public {
        uint256 ownerId = walletToUserId[msg.sender];

        if (ownerId == 0) {
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
