const hre = require("hardhat");

async function main() {
    const [contractAddress] = process.argv.slice(2);

    if (!contractAddress) {
        console.error("Usage: node scripts/getAllTransactions.js <contractAddress>");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    // Get all purchase initiated events
    const filter = escrow.filters.PurchaseInitiated();
    const events = await escrow.queryFilter(filter, -10000);

    console.log("\n=== All Transactions Report ===");
    console.log(`Total transactions: ${events.length}\n`);

    let completedCount = 0;
    let totalVolume = 0n;

    for (const event of events) {
        const txId = event.args[0];
        try {
            const txRecord = await escrow.getTransaction(txId);
            const land = await escrow.getLand(txRecord.landId);
            const seller = await escrow.getUser(txRecord.sellerId);
            const buyer = await escrow.getUser(txRecord.buyerId);

            const statusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];
            const status = statusMap[txRecord.status] || "Unknown";

            if (txRecord.status === 3) {
                completedCount++;
                totalVolume += txRecord.amount;
            }

            console.log(`Transaction ID: ${txRecord.id}`);
            console.log(`  Land: ${land.title}`);
            console.log(`  Seller: ${seller.fullName}`);
            console.log(`  Buyer: ${buyer.fullName}`);
            console.log(`  Amount: ${hre.ethers.formatEther(txRecord.amount)} ETH`);
            console.log(`  Status: ${status}`);
            console.log(`  Date: ${new Date(Number(txRecord.timestamp) * 1000).toISOString()}`);
            console.log();
        } catch (err) {
            console.log(`Transaction ID: ${txId} - Error: ${err.message}\n`);
        }
    }

    console.log("\n=== Summary ===");
    console.log(`Total transactions: ${events.length}`);
    console.log(`Completed transactions: ${completedCount}`);
    console.log(`Total volume: ${hre.ethers.formatEther(totalVolume)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});