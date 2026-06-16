# Smart Land Plot System

## Project Overview

`smartlandplotsys` is a Solidity-based land sale escrow system built with Hardhat. It supports registrar-controlled registration, seller listing, buyer escrow payments, and registrar-managed approval, transfer, and reversal.

The project includes:

- `contracts/LandSaleEscrow.sol`: escrow contract logic
- `contracts/storage/LandEscrowStorage.sol`: shared state variables
- `contracts/models/`: `User`, `Land`, `TransactionRecord` structs
- `contracts/enums/`: `UserRole`, `LandStatus`, `TransactionStatus`
- `contracts/errors/LandErrors.sol`: custom revert errors
- `contracts/interfaces/IEvents.sol`: event definitions (implemented by LandSaleEscrow)
- `scripts/`: deployment and local data / on-chain sync scripts
- `data/`: dummy JSON data files
- `test/`: Hardhat unit tests

## Roles and Permissions

### Registrar

The contract deployer is the registrar. Registrar-only functions include:

- `registerUser(fullName, wallet, role)`
- `registerLand(title, location, size, ownerId)`
- `approveSale(transactionId)`
- `finalizeTransaction(transactionId)`
- `reverseTransaction(transactionId)`

### Seller

Seller responsibilities:

- register land via registrar
- list land for sale with `listLand(landId, price)`
- inspect land via `getLand(landId)`
- verify transaction progress via `getTransaction(transactionId)`

### Buyer

Buyer responsibilities:

- verify land using `getLand(landId)`
- initiate purchase with `initiatePurchase(landId)`
- pay escrow using `payForTransaction(transactionId)`
- verify progress using `getTransaction(transactionId)`

## Setup

Install dependencies and compile the contracts:

```bash
npm install
npm run compile
```

## Data Files

Dummy data is stored in:

- `data/users.txt`
- `data/lands.txt`

These files are JSON arrays used by local scripts for testing and syncing.

## Available Scripts

- `npm run compile` — compile contracts
- `npm test` — run unit tests
- `npm run test:registrar` — run registrar control authorization tests (requires `npx hardhat node` running)
- `npm run deploy` — deploy contract to localhost
- `npm run init-data` — create sample `data/users.txt` and `data/lands.txt`
- `npm run fetch-data` — print local dummy data
- `npm run add-user -- "Full Name" "Role" "0xWallet"` — add a user to local data; role must be `Seller`, `Buyer`, or `Registrar`
- `npm run add-land -- "Title" "Location" 100 "OwnerWallet"` — add a land record locally; owner wallet must exist in `data/users.txt`
- `npm run sync-onchain -- <ContractAddress> --impersonate` — sync local data to deployed contract

## Quick Start

### 1. Initialize sample data

```bash
npm run init-data
```

### 2. Inspect local test data

```bash
npm run fetch-data
```

### 3. Add a new user locally

```bash
npm run add-user -- "Test User" "Buyer" "0x0000000000000000000000000000000000000003"
```

> **Important**: Wallet addresses must be valid Ethereum addresses (40 hex characters after `0x`).
> Invalid formats like `0xwallet` will cause the sync script to fail with a `resolveName` error.

Examples of valid addresses:
- `0x0000000000000000000000000000000000000001`
- `0x1234567890123456789012345678901234567890`
- `0xabcdefabcdefabcdefabcdefabcdefabcdefabcd`

### 4. Add a new land entry locally

```bash
npm run add-land -- "Demo Plot" "North Ridge" 150 "0x0000000000000000000000000000000000000003"
```

### 5. Deploy to a local node

Open a terminal and start Hardhat node:

```bash
npx hardhat node
```

> Note: the correct command is `npx hardhat node`. A common typo is `npx hardhart node`, which will fail with an `npm ERR! 404` error.

Open another terminal and deploy:

```bash
npm run deploy
```

Copy the deployed contract address from the output.

### 6. Sync local data to the deployed contract

Sync users and land from `data/*.txt` to the deployed contract:

```bash
npm run sync-onchain -- <ContractAddress> --impersonate
```

This script does the following:

- reads users from `data/users.txt`
- calls `registerUser(fullName, wallet, role)` as registrar
- reads lands from `data/lands.txt`
- calls `registerLand(title, location, size, ownerId)` as registrar
- when `price > 0`, impersonates the owner wallet and calls `listLand(landId, price)`

> Note: `--impersonate` is only required for the owner wallet listing step on a local Hardhat node.
>
> The script does not impersonate user wallets for registration; it uses the registrar deployer account to perform `registerUser` and `registerLand`.

### 7. Run the full escrow flow

After syncing data, the contract supports this flow:

1. Registrar registers users and land.
2. Seller lists land for sale.
3. Buyer initiates a purchase.
4. Buyer funds the escrow.
5. Registrar approves the sale.
6. Registrar finalizes ownership transfer and payment release.
7. Registrar can reverse and refund if needed.

## How to Run Tests

```bash
npm test
```

This verifies:

- registrar control and ownership
- registrar registration of users and land
- seller listing
- buyer purchase initiation and escrow payment
- registrar approval and finalization
- registrar reversal and refund

### Testing registrar-only authorization

The test suite includes explicit tests that verify registrar-only constraints. Run the full suite to confirm:

**Registrar-only functions tested:**

1. `registerUser(fullName, wallet, role)` — Registrar-only
   - Test: "should revert when non-registrar tries to register a user"
   - Non-registrar attempt throws `Unauthorized` error

2. `registerLand(title, location, size, ownerId)` — Registrar-only
   - Test: "should revert when non-registrar tries to register land"
   - Non-registrar attempt throws `Unauthorized` error

3. `approveSale(transactionId)` — Registrar-only
   - Tested as part of "should emit SaleApproved and TransferCompleted when registrar finalizes"
   - Only registrar can move transaction from `Funded` to `Approved`

4. `finalizeTransaction(transactionId)` — Registrar-only
   - Tested as part of "should emit SaleApproved and TransferCompleted when registrar finalizes"
   - Only registrar can transfer ownership and release funds

5. `reverseTransaction(transactionId)` — Registrar-only
   - Tested as part of "should emit TransactionReversed when registrar cancels a funded transaction"
   - Only registrar can refund and cancel transactions

**Example: How authorization is tested**

```javascript
it("should revert when non-registrar tries to register a user", async function () {
    await expect(
        escrow.connect(seller).registerUser("Attacker", seller.address, 0)
    ).to.be.revertedWithCustomError(escrow, "Unauthorized");
});
```

This test confirms that a seller account cannot call `registerUser`. Only the registrar (contract deployer) can succeed.

### Understanding "already registered" messages

When running `npm run sync-onchain` multiple times on the same contract instance:

```
Registering user Gabriel N. as 0x0000000000000000000000000000000000000001
 -> no UserRegistered event found (maybe already registered)
```

This means:
- The contract already has this user registered (from a previous `sync-onchain` run)
- The `registerUser` call was rejected by the contract (duplicate wallet check in `registerUser`)
- The event was not emitted because the transaction reverted
- This is expected behavior and is not an error

To start fresh, redeploy the contract with `npm run deploy` and then run `npm run sync-onchain` again.

## Manual Testing: Registrar vs Non-Registrar

The easiest way to test registrar-only constraints is to run the dedicated test script:

### Quick start: Run the registrar control tests

Start a Hardhat node in one terminal:

```bash
npx hardhat node
```

In another terminal, run the test script:

```bash
npm run test:registrar
```

This script will:
1. Deploy a fresh contract
2. Test registrar CAN register users
3. Test non-registrar CANNOT register users
4. Test registrar CAN register land
5. Test non-registrar CANNOT register land
6. Run a complete escrow flow with approval and finalization
7. Test that non-registrar cannot approve sales

Expected output:
```
========================================
Testing Registrar Control
========================================

Accounts:
  Registrar (deployer): 0x...
  Seller:               0x...
  Buyer:                0x...

Deploying fresh LandSaleEscrow contract...
✓ Deployed to: 0x...

TEST 1: Registrar registers a user
----------------------------------
✓ User registered with ID 1: Alice (Seller)

TEST 2: Registrar registers a second user
----------------------------------------
✓ User registered with ID 2: Bob (Buyer)

TEST 3: Seller tries to register a user (should fail)
----------------------------------------------------
✓ Seller blocked with Unauthorized error

TEST 4: Registrar registers land
--------------------------------
✓ Land registered with ID 1: Green Plot

TEST 5: Buyer tries to register land (should fail)
--------------------------------------------------
✓ Buyer blocked with Unauthorized error

TEST 6: Seller lists their land for sale
--------------------------------------
✓ Land listed for 1.0 ETH

TEST 7: Full escrow flow (initiate → pay → approve → finalize)
-------------------------------------------------------------
  ✓ Buyer initiated purchase (transaction ID: 1)
  ✓ Buyer paid 1.0 ETH into escrow
  ✓ Registrar approved the sale
  ✓ Registrar finalized transaction
  ✓ Seller received payment (balance increased)
  ✓ Land ownership changed from user 1 to user 2

TEST 8: Buyer tries to approve a sale (should fail)
--------------------------------------------------
✓ Seller blocked with Unauthorized error

========================================
All tests complete!
========================================
```

### Detailed script location

The test script is located at: `scripts/testRegistrarControl.js`

You can also run it directly:

```bash
npx hardhat run scripts/testRegistrarControl.js --network localhost
```

This approach is cleaner than using Hardhat console interactively, since it:
- Deploys a fresh contract each time
- Eliminates "already registered" errors
- Provides clear pass/fail output for each test
- Demonstrates all registrar authorization scenarios

## Contract Function Summary

### Contract events

The following events are defined in `contracts/LandSaleEscrow.sol`:

- `UserRegistered(uint256 userId, address wallet)`
- `LandRegistered(uint256 landId, uint256 ownerId)`
- `LandListed(uint256 landId, uint256 price)`
- `PurchaseInitiated(uint256 transactionId, uint256 landId, uint256 buyerId)`
- `PaymentFunded(uint256 transactionId, uint256 amount)`
- `SaleApproved(uint256 transactionId)`
- `TransferCompleted(uint256 transactionId, uint256 landId, uint256 fromOwnerId, uint256 toOwnerId)`
- `TransactionReversed(uint256 transactionId)`

### Registrar functions

- `registerUser(fullName, wallet, role)` — create a user record for the given wallet
- `registerLand(title, location, size, ownerId)` — create a land record for a seller
- `approveSale(transactionId)` — approve a funded escrow
- `finalizeTransaction(transactionId)` — transfer land and release funds
- `reverseTransaction(transactionId)` — refund the buyer and restore listing

### Seller functions

- `listLand(landId, price)` — put land up for sale

### Buyer functions

- `initiatePurchase(landId)` — create a transaction record
- `payForTransaction(transactionId)` — fund the transaction

### Read functions

- `getUser(userId)` — return user details
- `getLand(landId)` — return land details
- `getTransaction(transactionId)` — return transaction details

## Notes

- The registrar is the only account that can create users and land on-chain.
- Sellers can only list land they own.
- Buyers can only initiate and fund purchases for listed land.
- The escrow funds stay in contract balance until registrar approves or reverses.
- `data/*.txt` is local dummy data and is separate from on-chain state.
