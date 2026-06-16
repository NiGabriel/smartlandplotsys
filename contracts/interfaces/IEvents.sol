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
}