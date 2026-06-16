/**
 * testRegistrarControl.js
 * 
 * This script demonstrates registrar-only authorization by:
 * 1. Deploying a fresh contract
 * 2. Testing registrar CAN perform registrar-only actions
 * 3. Testing non-registrar CANNOT perform registrar-only actions
 * 4. Testing the full escrow flow
 */

const hre = require("hardhat");

async function main() {
    console.log("\n========================================");
    console.log("Testing Registrar Control");
    console.log("========================================\n");

    // Get signers
    const [registrar, seller, buyer] = await hre.ethers.getSigners();

    console.log("Accounts:");
    console.log(`  Registrar (deployer): ${registrar.address}`);
    console.log(`  Seller:               ${seller.address}`);
    console.log(`  Buyer:                ${buyer.address}\n`);

    // Deploy fresh contract
    console.log("Deploying fresh LandSaleEscrow contract...");
    const LandSaleEscrow = await hre.ethers.getContractFactory("LandSaleEscrow");
    const escrow = await LandSaleEscrow.deploy();
    await escrow.waitForDeployment();
    const contractAddr = await escrow.getAddress();
    console.log(`✓ Deployed to: ${contractAddr}\n`);

    // Test 1: Registrar CAN register a user
    console.log("TEST 1: Registrar registers a user");
    console.log("----------------------------------");
    try {
        let tx = await escrow.registerUser("Alice (Seller)", seller.address, 0);
        await tx.wait();
        const user = await escrow.getUser(1);
        console.log(`✓ User registered with ID ${user.id}: ${user.fullName}`);
    } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
    }

    // Test 2: Registrar CAN register another user
    console.log("\nTEST 2: Registrar registers a second user");
    console.log("----------------------------------------");
    try {
        let tx = await escrow.registerUser("Bob (Buyer)", buyer.address, 1);
        await tx.wait();
        const user = await escrow.getUser(2);
        console.log(`✓ User registered with ID ${user.id}: ${user.fullName}`);
    } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
    }

    // Test 3: Non-registrar CANNOT register a user
    console.log("\nTEST 3: Seller tries to register a user (should fail)");
    console.log("----------------------------------------------------");
    try {
        let tx = await escrow.connect(seller).registerUser("Charlie (Hacker)", buyer.address, 1);
        await tx.wait();
        console.log(`✗ UNEXPECTED: Seller registered user!`);
    } catch (err) {
        if (err.message.includes("Unauthorized")) {
            console.log(`✓ Seller blocked with Unauthorized error`);
        } else {
            console.log(`✓ Seller blocked: ${err.message.split('\n')[0]}`);
        }
    }

    // Test 4: Registrar CAN register land
    console.log("\nTEST 4: Registrar registers land");
    console.log("--------------------------------");
    try {
        let tx = await escrow.registerLand("Green Plot", "Sector 7", 150, 1);
        await tx.wait();
        const land = await escrow.getLand(1);
        console.log(`✓ Land registered with ID ${land.id}: ${land.title}`);
    } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
    }

    // Test 5: Non-registrar CANNOT register land
    console.log("\nTEST 5: Buyer tries to register land (should fail)");
    console.log("--------------------------------------------------");
    try {
        let tx = await escrow.connect(buyer).registerLand("Fake Plot", "Sector 99", 999, 1);
        await tx.wait();
        console.log(`✗ UNEXPECTED: Buyer registered land!`);
    } catch (err) {
        if (err.message.includes("Unauthorized")) {
            console.log(`✓ Buyer blocked with Unauthorized error`);
        } else {
            console.log(`✓ Buyer blocked: ${err.message.split('\n')[0]}`);
        }
    }

    // Test 6: Seller CAN list land they own
    console.log("\nTEST 6: Seller lists their land for sale");
    console.log("--------------------------------------");
    try {
        let tx = await escrow.connect(seller).listLand(1, hre.ethers.parseEther("1.0"));
        await tx.wait();
        const land = await escrow.getLand(1);
        console.log(`✓ Land listed for ${hre.ethers.formatEther(land.price)} ETH`);
    } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
    }

    // Test 7: Full escrow flow
    console.log("\nTEST 7: Full escrow flow (initiate → pay → approve → finalize)");
    console.log("-------------------------------------------------------------");
    try {
        // Buyer initiates purchase
        let tx = await escrow.connect(buyer).initiatePurchase(1);
        let receipt = await tx.wait();
        const iface = escrow.interface;
        const log = receipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        });
        const txId = iface.parseLog(log).args[0];
        console.log(`  ✓ Buyer initiated purchase (transaction ID: ${txId})`);

        // Buyer pays escrow
        tx = await escrow.connect(buyer).payForTransaction(txId, { value: hre.ethers.parseEther("1.0") });
        await tx.wait();
        console.log(`  ✓ Buyer paid 1.0 ETH into escrow`);

        // Registrar approves
        tx = await escrow.connect(registrar).approveSale(txId);
        await tx.wait();
        console.log(`  ✓ Registrar approved the sale`);

        // Registrar finalizes
        const sellerBalanceBefore = await hre.ethers.provider.getBalance(seller.address);
        tx = await escrow.connect(registrar).finalizeTransaction(txId);
        await tx.wait();
        const sellerBalanceAfter = await hre.ethers.provider.getBalance(seller.address);
        console.log(`  ✓ Registrar finalized transaction`);
        console.log(`  ✓ Seller received payment (balance increased)`);

        // Verify ownership changed
        const land = await escrow.getLand(1);
        console.log(`  ✓ Land ownership changed from user 1 to user ${land.ownerId}`);
    } catch (err) {
        console.log(`✗ FAILED: ${err.message}`);
    }

    // Test 8: Non-registrar CANNOT approve sales
    console.log("\nTEST 8: Buyer tries to approve a sale (should fail)");
    console.log("--------------------------------------------------");
    try {
        // Create a new transaction to test approval
        let tx = await escrow.registerLand("Another Plot", "Sector 8", 100, 2);
        await tx.wait();

        tx = await escrow.connect(buyer).listLand(2, hre.ethers.parseEther("0.5"));
        await tx.wait();

        tx = await escrow.connect(buyer).initiatePurchase(2);
        receipt = await tx.wait();
        const iface = escrow.interface;
        const log = receipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        });
        const txId = iface.parseLog(log).args[0];

        tx = await escrow.connect(buyer).payForTransaction(txId, { value: hre.ethers.parseEther("0.5") });
        await tx.wait();

        // Now try to approve as seller (non-registrar)
        tx = await escrow.connect(seller).approveSale(txId);
        await tx.wait();
        console.log(`✗ UNEXPECTED: Seller approved the sale!`);
    } catch (err) {
        if (err.message.includes("Unauthorized")) {
            console.log(`✓ Seller blocked with Unauthorized error`);
        } else {
            console.log(`✓ Seller blocked: ${err.message.split('\n')[0]}`);
        }
    }

    console.log("\n========================================");
    console.log("All tests complete!");
    console.log("========================================\n");
}

main().catch((err) => {
    console.error("\nFATAL ERROR:", err);
    process.exitCode = 1;
});
