const hre = require("hardhat");

async function main() {
    const [contractAddress] = process.argv.slice(2);

    if (!contractAddress) {
        console.error("Usage: npm run all-transactions -- <contractAddress>");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt(
        "LandSaleEscrow",
        contractAddress,
        provider
    );

    const filter = escrow.filters.PurchaseInitiated();
    const events = await escrow.queryFilter(filter, 0, "latest");

    console.log("\n=== All Transactions Report ===");
    console.log(`Total transactions: ${events.length}\n`);

    const statusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];

    let completedCount = 0;
    let totalVolume = 0n;

    for (const event of events) {
        const txId = Number(event.args[0]);

        try {
            const txRecord = await escrow.getTransaction(txId);

            const statusIndex = Number(txRecord.status);

            const land = await escrow.getLand(txRecord.landId);
            const seller = await escrow.getUser(txRecord.sellerId);
            const buyer = await escrow.getUser(txRecord.buyerId);

            const status = statusMap[statusIndex] || "Unknown";

            if (statusIndex === 3) {
                completedCount++;
                totalVolume += BigInt(txRecord.amount);
            }

            console.log(`Transaction ID: ${txRecord.id.toString()}`);
            console.log(`  Land: ${land.title}`);
            console.log(`  Seller: ${seller.fullName}`);
            console.log(`  Buyer: ${buyer.fullName}`);
            console.log(`  Amount: ${hre.ethers.formatEther(txRecord.amount)} ETH`);
            console.log(`  Status: ${status}`);
            console.log(
                `  Date: ${new Date(Number(txRecord.timestamp) * 1000).toISOString()}`
            );
            console.log();
        } catch (err) {
            console.log(
                `Transaction ID: ${txId} - Error: ${err.message}\n`
            );
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