const hre = require("hardhat");

async function main() {
    const [contractAddress, landIdArg] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: node scripts/getLandTransactionHistory.js <contractAddress> <landId>");
        process.exit(1);
    }

    const landId = Number(landIdArg);
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    // Get land details
    const land = await escrow.getLand(landId);
    console.log("\n=== Land Details ===");
    console.log(`ID: ${land.id}`);
    console.log(`Title: ${land.title}`);
    console.log(`Location: ${land.location}`);
    console.log(`Size: ${land.size}`);
    console.log(`Current Owner ID: ${land.ownerId}`);
    console.log(`Status: ${land.status}`);
    console.log(`Current Listed Price: ${land.price === 0n ? "Not listed" : hre.ethers.formatEther(land.price) + " ETH"}`);

    // Get all transaction IDs (we'll need to query logs)
    const filter = escrow.filters.PurchaseInitiated(null, landId);
    const events = await escrow.queryFilter(filter);

    if (events.length === 0) {
        console.log("\n=== Transaction History ===");
        console.log("No transactions for this land.");
        return;
    }

    console.log("\n=== Transaction History ===");
    console.log(`Total purchases initiated: ${events.length}\n`);

    for (const event of events) {
        const txId = event.args[0];
        try {
            const txRecord = await escrow.getTransaction(txId);
            const seller = await escrow.getUser(txRecord.sellerId);
            const buyer = await escrow.getUser(txRecord.buyerId);

            console.log(`Transaction ID: ${txRecord.id}`);
            console.log(`  Seller: ${seller.fullName} (${seller.wallet})`);
            console.log(`  Buyer: ${buyer.fullName} (${buyer.wallet})`);
            console.log(`  Amount: ${hre.ethers.formatEther(txRecord.amount)} ETH`);
            console.log(`  Status: ${txRecord.status}`);
            console.log(`  Timestamp: ${new Date(Number(txRecord.timestamp) * 1000).toISOString()}`);
            console.log();
        } catch (err) {
            console.log(`Transaction ID: ${txId} - Error retrieving details: ${err.message}\n`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});