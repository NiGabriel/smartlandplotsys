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
- list land for sale with `listLand(landId, price)` **_(sets price in ETH)_**
- inspect land via `getLand(landId)` **_(displays current owner and price)_**
- verify transaction progress via `getTransaction(transactionId)`

### Buyer

Buyer responsibilities:

- verify land using `getLand(landId)` **_(displays current owner, listing price, and status)_**
- initiate purchase with `initiatePurchase(landId)`
- pay escrow using `payForTransaction(transactionId)` **_(transfers ETH to contract escrow)_**
- verify progress using `getTransaction(transactionId)`

## Price & ETH Management

The system manages land prices entirely in **Ethereum (ETH)**:

- **Listing Price**: When a seller calls `listLand(landId, price)`, the `price` parameter is specified in Wei (smallest ETH unit). Use `npm run list-land -- <contractAddress> <landId> <priceInEther>` to specify price in ETH (e.g., `1.5` for 1.5 ETH).

- **Price Tracking**: Each transaction records the exact amount in ETH. View price history and all offers for a land with `npm run price-history`.

- **Ownership Changes**: When a transaction is completed:
  - Seller receives their full listed price in ETH (funds are held in contract escrow until finalization)
  - Land ownership transfers to buyer
  - Land status changes to "Sold"

- **Price History**: Track all listing prices, offers, and completed sales for any land using the price history and transaction tracking commands.

- **Transaction Volume**: All transaction amounts are tracked and can be viewed with `npm run all-transactions` to see total volume in ETH.

- **Fund Management**:
  - Buyer funds are held in contract escrow when `payForTransaction()` is called
  - Registrar can approve or reverse transactions
  - On approval + finalization, funds are released to seller
  - On reversal, funds are refunded to buyer

## Setup

Install dependencies and compile the contracts:

```bash
npm install
npm run compile
```

## Data Files

Dummy data is stored in:

- `data/users.txt` — users and their roles (Seller, Buyer, Registrar)
- `data/lands.txt` — land properties and ownership
- `data/accounts.txt` — blockchain accounts with private keys and initial ETH balances
- `data/transactions.txt` — recorded transaction history (synced from blockchain)

These files are JSON arrays used by local scripts for testing, syncing, and auditing.

## Available Scripts

### Compilation & Testing

- `npm run compile` — compile contracts
- `npm test` — run unit tests
- `npm run test:registrar` — run registrar control authorization tests (requires `npx hardhat node` running)
- `npm run deploy` — deploy contract to localhost

### Local Data Management

- `npm run init-data` — create sample `data/users.txt` and `data/lands.txt`
- `npm run fetch-data` — print local dummy data
- `npm run add-user -- "Full Name" "Role" "0xWallet"` — add a user to local data; role must be `Seller`, `Buyer`, or `Registrar`
- `npm run add-land -- "Title" "Location" 100 "OwnerWallet"` — add a land record locally; owner wallet must exist in `data/users.txt`

### Account Management (Private Keys & ETH Balances)

- `npm run init-accounts` — create sample `data/accounts.txt` with test accounts and private keys
- `npm run fetch-accounts` — view all accounts with private keys, balances, and linked users
- `npm run add-account -- "0xWallet" "PrivateKey" 50 [userId]` — add a blockchain account with private key and initial ETH balance (in ETH); optionally link to a user ID
- `npm run link-account -- <accountId> <userId>` — link an existing account to a user (for buyer/seller identification)

### Transaction Management (Logging & Auditing)

- `npm run fetch-transactions` — view all recorded transactions (type, amount, status, participants)
- `npm run sync-transactions -- <ContractAddress>` — extract all transactions from deployed contract and store locally in `data/transactions.txt` (idempotent — only records new transactions)

### On-Chain Sync

- `npm run sync-onchain -- <ContractAddress> --impersonate` — sync local data to deployed contract

### Land Management

- `npm run list-land -- <ContractAddress> <landId> <priceInEther> [signerAddress]` — list a land for sale at specified price (in ETH)
- `npm run get-land -- <ContractAddress> <landId>` — retrieve land details (title, location, owner, price, status)

### Purchase & Transaction Flow

- `npm run initiate-purchase -- <ContractAddress> <landId> [buyerAddress]` — buyer initiates purchase for a land
- `npm run pay-transaction -- <ContractAddress> <transactionId> <amountInEther> [buyerAddress]` — buyer pays escrow (amount must match land price)
- `npm run approve-sale -- <ContractAddress> <transactionId> [registrarAddress]` — registrar approves funded sale
- `npm run finalize-transaction -- <ContractAddress> <transactionId> [registrarAddress]` — registrar finalizes transaction (transfers funds to seller, updates ownership)
- `npm run reverse-transaction -- <ContractAddress> <transactionId> [registrarAddress]` — registrar cancels transaction and refunds buyer

### Query & Inspection

- `npm run get-user -- <ContractAddress> <userId>` — retrieve user details (name, wallet, role)
- `npm run get-transaction -- <ContractAddress> <transactionId>` — retrieve transaction details (amount, status, seller, buyer, timestamp)

### Transaction & Price History Tracking

- `npm run land-history -- <ContractAddress> <landId>` — view all transactions for a specific land (buyers, prices, statuses)
- `npm run user-history -- <ContractAddress> <userId>` — view all transactions involving a user (as seller or buyer)
- `npm run price-history -- <ContractAddress> <landId>` — view price history and ownership changes for a land (shows all listing prices and current owner)
- `npm run all-transactions -- <ContractAddress>` — view all transactions in the system with summary (total transactions, completed count, total volume in ETH)
- `npm run dashboard -- <ContractAddress>` — view comprehensive dashboard (user count by role, land count by status, transaction statistics, total transaction volume)

## Quick Start

### 1. Initialize sample data

```bash
npm run init-data
npm run init-accounts
```

### 2. Inspect local test data

```bash
npm run fetch-data
npm run fetch-accounts
```

### 3. Link accounts to users

View the accounts and users, then link them:

```bash
npm run link-account -- 1 1
npm run link-account -- 2 2
```

This links:
- Account ID 1 (wallet 0x...0001) → User ID 1 (Seller)
- Account ID 2 (wallet 0x...0002) → User ID 2 (Buyer)

### 4. Add a new account with private key and balance

```bash
npm run add-account -- "0x1234567890123456789012345678901234567890" "0x0000000000000000000000000000000000000000000000000000000000000099" 100 3
```

This creates an account with 100 ETH initial balance, linked to User ID 3.

> **Important**: Each account requires:
> - **Wallet**: Valid Ethereum address (0x + 40 hex chars)
> - **Private Key**: 64 hex characters (use for signing transactions)
> - **Initial Balance**: ETH amount for testing
> - **User Link** (optional): Links the account to a user ID for buyer/seller identification

### 5. Add a new land entry locally

```bash
npm run add-land -- "Demo Plot" "North Ridge" 150 "0x0000000000000000000000000000000000000003"
```

### 6. Deploy to a local node

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

### 7. Sync local data to the deployed contract

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

### 8. Sync transactions to local storage

After performing transactions on-chain, extract and store them locally:

```bash
npm run sync-transactions -- <ContractAddress>
```

View all recorded transactions:

```bash
npm run fetch-transactions
```



## Usage Examples: Price Management & Transactions

### List land for sale (Seller action)

```bash
npm run list-land -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1 2.5
```

This lists land ID 1 for sale at **2.5 ETH**. The seller's address must be impersonated or be the current signer.

### Buyer initiates purchase

```bash
npm run initiate-purchase -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1
```

This returns the transaction ID (needed for the next step).

### Buyer pays into escrow (exact amount required)

```bash
npm run pay-transaction -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1 2.5
```

The buyer must pay exactly **2.5 ETH** (matching the listed price). The amount is held in contract escrow.

### Registrar approves the sale

```bash
npm run approve-sale -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1
```

### Registrar finalizes transaction (transfers ownership & funds)

```bash
npm run finalize-transaction -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1
```

This:
- Transfers 2.5 ETH from escrow to seller wallet
- Updates land ownership to buyer
- Changes land status to "Sold"

### Track all prices for a land (including history)

```bash
npm run price-history -- 0x5FbDB2315678afccb333f8a9fcff40144967d408 1
```

Shows:
- All listing prices
- All offers and their statuses
- Current owner
- Completed sales

### View all transactions in the system

```bash
npm run all-transactions -- 0x5FbDB2315678afccb333f8a9fcff40144967d408
```

Shows:
- Total transaction count and volume (in ETH)
- Status breakdown (Created, Funded, Approved, Completed, Cancelled)
- Details of each transaction

### View system dashboard

```bash
npm run dashboard -- 0x5FbDB2315678afccb333f8a9fcff40144967d408
```

Shows comprehensive overview:
- User count by role
- Land count by status
- Transaction statistics
- Total transaction volume in ETH

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

## Complete Data Architecture

The system manages four interconnected data layers for full traceability:

### 1. **Users** (`data/users.txt`)
- User profiles with roles (Seller, Buyer, Registrar)
- Wallet addresses linked to users
- Example: `{ id: 1, fullName: "John Doe", wallet: "0x...", role: "Seller", exists: true }`

### 2. **Accounts** (`data/accounts.txt`)
- Blockchain accounts with **private keys** and **ETH balances**
- Can be linked to users for buyer/seller identification
- Tracks initial balance and account linking timestamp
- Example: `{ id: 1, wallet: "0x...", privateKey: "0x...", initialBalance: 100, userId: 1, createdAt: "...", linkedAt: "..." }`

### 3. **Lands** (`data/lands.txt`)
- Land properties: title, location, size, owner ID
- Current status and listed price (in ETH)
- Example: `{ id: 1, title: "Green Plot", location: "Kigali", size: 150, ownerId: 1, price: 2.5, status: "Listed" }`

### 4. **Transactions** (`data/transactions.txt`)
- All on-chain transactions extracted and stored locally
- Includes: land title, participants (seller/buyer names), amount in ETH, status, timestamp
- Example: `{ id: 1, chainTransactionId: "1", timestamp: "2026-06-17T...", type: "Purchase", landId: 1, landTitle: "Green Plot", sellerId: 1, sellerName: "John Doe", buyerId: 2, buyerName: "Jane Doe", amount: "2.5", status: "Completed", blockNumber: 123456 }`

### Data Flow & Workflow

```
STEP 1: Account Setup
├─ npm run init-accounts → Create accounts with private keys & ETH
├─ npm run add-account → Add custom accounts
└─ npm run link-account → Link accounts to users (buyer/seller)

STEP 2: User & Land Setup
├─ npm run init-data → Create users and lands
├─ npm run add-user → Add more users
└─ npm run add-land → Add more lands

STEP 3: Deploy & Sync to Blockchain
├─ npm run deploy → Deploy contract
├─ npm run sync-onchain → Register users/lands on-chain
└─ Contract now holds on-chain state

STEP 4: Execute Transactions
├─ Seller lists land (listLand)
├─ Buyer initiates purchase (initiatePurchase)
├─ Buyer pays escrow (payForTransaction)
├─ Registrar approves (approveSale)
└─ Registrar finalizes (finalizeTransaction)
    → Ownership transfers, funds released to seller

STEP 5: Record Transactions Locally
├─ npm run sync-transactions → Extract all transactions from blockchain
└─ All transactions now stored in data/transactions.txt for auditing

STEP 6: Query & Analyze
├─ npm run fetch-accounts → View all accounts and links
├─ npm run fetch-transactions → View all recorded transactions
├─ npm run land-history → View all transactions for a land
├─ npm run user-history → View transactions for a user
├─ npm run price-history → View price history and ownership changes
└─ npm run dashboard → View system overview
```

### Complete Data Traceability

By storing accounts, users, lands, and transactions locally, the system provides:

- **Account Audit Trail**: Track which blockchain account corresponds to which user
- **Transaction History**: Full log of all transactions with parties and amounts
- **Price History**: Complete pricing record for each land (all offers, not just completed sales)
- **Ownership Trail**: See how land ownership changed over time
- **Fund Flow**: Track ETH movement from buyer accounts to escrow to seller accounts
- **User Activity**: See all transactions involving a specific user (as buyer or seller)

### Example: Tracing a Land Sale

1. **Create account & link to user**:
   ```bash
   npm run add-account -- "0x1234...5678" "0xabcd...ef01" 100 1
   npm run link-account -- 1 1  # Account 1 → User 1 (Seller)
   ```

2. **Register land**:
   ```bash
   npm run add-land -- "My Plot" "Kigali" 200 "0x1234...5678"
   ```

3. **Deploy & sync**:
   ```bash
   npm run deploy
   npm run sync-onchain -- 0x5FbDB...d408
   ```

4. **Seller lists land** (100 ETH):
   ```bash
   npm run list-land -- 0x5FbDB...d408 1 100
   ```

5. **Buyer initiates purchase**:
   ```bash
   npm run initiate-purchase -- 0x5FbDB...d408 1
   ```

6. **Buyer pays escrow**:
   ```bash
   npm run pay-transaction -- 0x5FbDB...d408 1 100
   ```

7. **Registrar approves & finalizes**:
   ```bash
   npm run approve-sale -- 0x5FbDB...d408 1
   npm run finalize-transaction -- 0x5FbDB...d408 1
   ```

8. **Sync transactions & audit**:
   ```bash
   npm run sync-transactions -- 0x5FbDB...d408
   npm run fetch-transactions  # View all recorded transactions
   npm run price-history -- 0x5FbDB...d408 1  # View land price history & ownership change
   npm run user-history -- 0x5FbDB...d408 1  # View seller's transactions
   ```

All data is now stored and fully traceable in `data/*.txt` files.
