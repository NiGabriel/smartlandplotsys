const hre = require("hardhat");

async function main() {
    const [contractAddress, landIdArg] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: node scripts/getLandPriceHistory.js <contractAddress> <landId>");
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
    console.log("\n=== Land: " + land.title + " ===");
    console.log(`ID: ${land.id}`);
    console.log(`Current Owner ID: ${land.ownerId}`);
    console.log(`Current Status: ${land.status}`);
    console.log(`Current Listed Price: ${land.price === 0n ? "Not listed" : hre.ethers.formatEther(land.price) + " ETH"}`);

    // Get all land-related transactions
    const filter = escrow.filters.PurchaseInitiated(null, landId);
    const events = await escrow.queryFilter(filter);

    if (events.length === 0) {
        console.log("\n=== Price History ===");
        console.log("No transactions - land has not been listed or sold yet.");
        return;
    }

    console.log("\n=== Price History (All Listing & Transaction Events) ===\n");

    const priceHistory = [];

    for (const event of events) {
        const txId = event.args[0];
        try {
            const txRecord = await escrow.getTransaction(txId);
            const statusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];
            const status = statusMap[txRecord.status] || "Unknown";

            priceHistory.push({
                txId: txRecord.id,
                price: txRecord.amount,
                status: status,
                timestamp: Number(txRecord.timestamp),
                sellerId: txRecord.sellerId,
                buyerId: txRecord.buyerId,
            });
        } catch (err) {
            // Transaction not found
        }
    }

    // Sort by timestamp
    priceHistory.sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i < priceHistory.length; i++) {
        const entry = priceHistory[i];
        console.log(`[${i + 1}] Transaction ID: ${entry.txId}`);
        console.log(`    Date: ${new Date(entry.timestamp * 1000).toISOString()}`);
        console.log(`    Price Offered: ${hre.ethers.formatEther(entry.price)} ETH`);
        console.log(`    Status: ${entry.status}`);
        if (entry.status === "Completed") {
            console.log(`    ✓ SOLD - Ownership transferred`);
        }
        console.log();
    }

    // Get current owner
    try {
        const currentOwner = await escrow.getUser(land.ownerId);
        console.log("=== Current Ownership ===");
        console.log(`Owner: ${currentOwner.fullName}`);
        console.log(`Owner Wallet: ${currentOwner.wallet}`);
        console.log(`Owner Role: ${currentOwner.role}`);
    } catch (err) {
        console.log("Could not retrieve owner details.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});