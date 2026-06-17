const hre = require("hardhat");

async function main() {
    const [contractAddress, userIdArg] = process.argv.slice(2);

    if (!contractAddress || !userIdArg) {
        console.error("Usage: node scripts/getUserTransactionHistory.js <contractAddress> <userId>");
        process.exit(1);
    }

    const userId = Number(userIdArg);
    if (!Number.isInteger(userId) || userId <= 0) {
        console.error("userId must be a positive integer.");
        process.exit(1);
    }

    const escrow = await getEscrowContract(contractAddress);

    // Get user details
    const user = await escrow.getUser(userId);
    console.log("\n=== User Details ===");
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.fullName}`);
    console.log(`Wallet: ${user.wallet}`);
    console.log(`Role: ${user.role}`);

    // Get transactions as seller
    const sellerFilter = escrow.filters.PurchaseInitiated(null, null, userId);
    const sellerEvents = await escrow.queryFilter(sellerFilter);

    // Get transactions as buyer
    const buyerFilter = escrow.filters.PurchaseInitiated(null, null, null);
    const allPurchaseEvents = await escrow.queryFilter(buyerFilter);

    console.log("\n=== Transactions as Seller ===");
    let sellerTxCount = 0;
    for (const event of sellerEvents) {
        const txId = event.args[0];
        try {
            const txRecord = await escrow.getTransaction(txId);
            if (txRecord.sellerId.toString() === userId.toString()) {
                sellerTxCount++;
                const land = await escrow.getLand(txRecord.landId);
                const buyer = await escrow.getUser(txRecord.buyerId);

                console.log(`\nTransaction ID: ${txRecord.id}`);
                console.log(`  Land: ${land.title} (ID: ${land.id})`);
                console.log(`  Buyer: ${buyer.fullName}`);
                console.log(`  Amount: ${hre.ethers.formatEther(txRecord.amount)} ETH`);
                console.log(`  Status: ${txRecord.status}`);
                console.log(`  Timestamp: ${new Date(Number(txRecord.timestamp) * 1000).toISOString()}`);
            }
        } catch (err) {
            // Transaction not found or error
        }
    }
    if (sellerTxCount === 0) {
        console.log("No transactions as seller.");
    }

    console.log("\n=== Transactions as Buyer ===");
    let buyerTxCount = 0;
    for (const event of allPurchaseEvents) {
        const txId = event.args[0];
        try {
            const txRecord = await escrow.getTransaction(txId);
            if (txRecord.buyerId.toString() === userId.toString()) {
                buyerTxCount++;
                const land = await escrow.getLand(txRecord.landId);
                const seller = await escrow.getUser(txRecord.sellerId);

                console.log(`\nTransaction ID: ${txRecord.id}`);
                console.log(`  Land: ${land.title} (ID: ${land.id})`);
                console.log(`  Seller: ${seller.fullName}`);
                console.log(`  Amount: ${hre.ethers.formatEther(txRecord.amount)} ETH`);
                console.log(`  Status: ${txRecord.status}`);
                console.log(`  Timestamp: ${new Date(Number(txRecord.timestamp) * 1000).toISOString()}`);
            }
        } catch (err) {
            // Transaction not found or error
        }
    }
    if (buyerTxCount === 0) {
        console.log("No transactions as buyer.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});