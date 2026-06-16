# Smart Land Plot System

## Project Overview

`smartlandplotsys` is a Solidity-based land sales escrow system built with Hardhat. The app models users, land records, and an escrow/deployment flow via the `LandSaleEscrow` contract. It also includes local dummy data files and Node scripts to manage those files for development and testing.

## Environment Setup

- Node.js and npm installed
- Hardhat project configured with `hardhat.config.js`
- Solidity compiler version `0.8.28`
- `package.json` includes Hardhat dependencies and scripts for compile, deploy, and data management

## Quick Commands

Use these quick commands to get started and run the test suite.

```bash
# install dependencies
npm install

# compile contracts
npm run compile

# run tests (preferred via npm)
npm test

# optional: initialize sample data files
npm run init-data

# inspect local dummy data
npm run fetch-data

# add user / land to local data files
npm run add-user -- "Full Name" "Role" "0xWallet"
npm run add-land -- "Title" "Location" 100 "OwnerWallet"

# deploy to a local node (start node first with `npx hardhat node`)
npm run deploy
```

## Contract Structure

The project is organized into multiple logical folders:

- `contracts/`
  - `LandSaleEscrow.sol`: main contract for user and land registration
  - `storage/LandEscrowStorage.sol`: shared storage state and mappings
  - `models/`: custom `struct` definitions
  - `enums/`: reusable status and role enums
  - `errors/`: custom error types
- `scripts/`: deployment and local data management scripts
- `data/`: dummy data files used by scripts
- `test/`: test folder (currently empty)

## Data Types and Structs

This project uses the following Solidity primitives:

- `uint256` for IDs, sizes, prices, and timestamps
- `string` for text fields like names, title, and location
- `address` for wallet accounts
- `bool` for existence checks
- `enum UserRole` for user roles (`Seller`, `Buyer`, `Registrar`)
- `enum LandStatus` for land lifecycle states (`Registered`, `Listed`, `PendingApproval`, `Sold`)

Defined structs:

- `User`: stores user profile data
- `Land`: stores land metadata
- `TransactionRecord`: stores transaction details (not yet used in `LandSaleEscrow`)

## Line-by-Line Explanation of `contracts/LandSaleEscrow.sol`

1. `// SPDX-License-Identifier: MIT`
   - License metadata for the contract.
2. `pragma solidity ^0.8.28;`
   - Uses Solidity compiler version 0.8.28 or higher.
3. `import "./storage/LandEscrowStorage.sol";`
   - Imports storage contract containing shared state variables.
4. `import "./modifiers/AccessModifiers.sol";`
   - Imports a modifier contract, currently unused in `LandSaleEscrow` but available for future access control.
5. `import "./models/User.sol";`
   - Imports the `User` struct definition.
6. `import "./enums/UserRole.sol";`
   - Imports user role enum.
7. `import "./errors/LandErrors.sol";`
   - Imports custom revert errors.
8. `import "./models/Land.sol";`
   - Imports the `Land` struct definition.
9. `import "./enums/LandStatus.sol";`
   - Imports land status enum.
10. `contract LandSaleEscrow is LandEscrowStorage {`
    - Declares the main contract and inherits shared storage state.
11. `event UserRegistered(uint256 userId, address wallet);`
    - Event emitted after a user is successfully registered.
12. `event LandRegistered(uint256 landId, uint256 ownerId);`
    - Event emitted after land is successfully registered.
13. `constructor() { registrar = msg.sender; }`
    - Sets the deployer as the registrar.
14. `function registerUser(string memory fullName, UserRole role) public {`
    - Public function to register a new user.
15. `if (bytes(fullName).length == 0) { revert InvalidData(); }`
    - Validates that the user name is not empty.
16. `if (msg.sender == address(0)) { revert InvalidAddress(); }`
    - Defensive check for an invalid sender address.
17. `nextUserId++;`
    - Increments the next available user ID.
18. `users[nextUserId] = User({ ... });`
    - Stores the new user in the `users` mapping.
19. `walletToUserId[msg.sender] = nextUserId;`
    - Maps the sender wallet to the new user ID.
20. `userIds.push(nextUserId);`
    - Appends the user ID to the `userIds` array.
21. `emit UserRegistered(nextUserId, msg.sender);`
    - Emits an event so off-chain apps can track new users.
22. `function registerLand(string memory title, string memory location, uint256 size) public {`
    - Public function to add new land.
23. `uint256 ownerId = walletToUserId[msg.sender];`
    - Finds the owner ID using the sender wallet.
24. `if (ownerId == 0) { revert UserNotFound(); }`
    - Requires the caller to be a registered user.
25. `nextLandId++;`
    - Increments the next available land ID.
26. `lands[nextLandId] = Land({ ... });`
    - Stores the new land record in the `lands` mapping.
27. `landIds.push(nextLandId);`
    - Adds the land ID to the `landIds` array.
28. `emit LandRegistered(nextLandId, ownerId);`
    - Emits an event for the new land record.
29. `function getUser(uint256 userId) public view returns (User memory) {`
    - Fetches a user by ID.
30. `if (!users[userId].exists) { revert UserNotFound(); }`
    - Reverts if the user is missing.
31. `return users[userId];`
    - Returns the user struct.
32. `function getLand(uint256 landId) public view returns (Land memory) {`
    - Fetches a land record by ID.
33. `if (!lands[landId].exists) { revert LandNotFound(); }`
    - Reverts if the land is missing.
34. `return lands[landId];`
    - Returns the land struct.
35. `}`
    - Ends the contract.

## Data files

Dummy files are stored in `data/`:

- `data/users.txt`
- `data/lands.txt`

These files contain JSON-formatted arrays and are used by local Node scripts to simulate fetch/add operations.

## Scripts

Available scripts in `package.json`:

- `npm run compile`
- `npm test`
- `npm run deploy`
- `npm run init-data`
- `npm run fetch-data`
- `npm run add-user -- "Full Name" "Seller" "0x..."`
- `npm run add-land -- "Title" "Location" 100 "0x..."`

### How the scripts work

- `deploy`: deploys the `LandSaleEscrow` contract to the configured Hardhat network.
- `init-data`: writes initial dummy records into `data/users.txt` and `data/lands.txt`.
- `fetch-data`: reads the dummy data files and prints their contents.
- `add-user`: appends a new user record to `data/users.txt`.
- `add-land`: appends a new land record to `data/lands.txt`.

## Notes

The contract stores state on-chain, while the scripts store dummy data locally in `data/*.txt`. This separation is intentional for development and demo purposes.

## Testing the Project (Quick Start)

Follow these steps to run the unit tests and exercise the local data scripts.

1. Install dependencies (if not already installed):

```bash
npm install
```

2. Compile contracts:

```bash
npm run compile
```

3. Initialize the local dummy data files (optional — `data/*.txt` will be created/overwritten):

```bash
npm run init-data
```

4. Run the unit tests (Hardhat + Mocha/Chai):

```bash
npx hardhat test
```

You should see output similar to:

```
    LandSaleEscrow
        ✔ should set registrar to deployer
        ✔ should register a user and emit UserRegistered
        ✔ should register land for an existing user and emit LandRegistered
        ✔ should revert when trying to register land with an unregistered address
        ✔ should revert when trying to get a non-existent user
        ✔ should revert when trying to get a non-existent land record

    6 passing
```

5. Use the data scripts to inspect or modify local dummy data:

```bash
npm run fetch-data          # prints data/users.txt and data/lands.txt
npm run add-user -- "Name" "Role" "0xWallet"   # append user
npm run add-land -- "Title" "Location" 100 "OwnerWallet"  # append land
```

6. Deploy locally (optional):

Start a local Hardhat node in one terminal:

```bash
npx hardhat node
```

In another terminal deploy to the local node:

```bash
npm run deploy
```

This will print the deployed `LandSaleEscrow` contract address.

## Test and Script Notes

- The unit tests live in `test/LandSaleEscrow.test.js` and exercise registration and error paths.
- The scripts under `scripts/` operate on the local `data/*.txt` JSON files; they are not connected to the on-chain state by default. Use `scripts/deploy.js` plus a quick `scripts/registerOnChain.js` (not included) to sync local data to chain if needed.
- If you get an error about versions or `deployed()` vs `waitForDeployment()`, ensure your Hardhat and Ethers versions match the ones in `package.json`.
