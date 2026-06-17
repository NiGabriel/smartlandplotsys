const hre = require("hardhat");
const { loadUsers, loadLands, loadTransactions, saveTransactions } = require("./dataHelpers");

async function main() {
    const [contractAddress] = process.argv.slice(2);

    if (!contractAddress) {
        console.error("Usage: node scripts/syncTransactions.js <contractAddress>");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    const users = loadUsers();
    const lands = loadLands();
    let transactions = loadTransactions();

    console.log("Syncing transactions from blockchain...\n");

    // Get all purchase initiated events
    const filter = escrow.filters.PurchaseInitiated();
    const events = await escrow.queryFilter(filter);

    console.log(`Found ${events.length} purchase events on-chain\n`);

    let newCount = 0;

    for (const event of events) {
        const txId = event.args[0];
        const landId = event.args[1];
        const buyerId = event.args[2];

        // Check if transaction already recorded
        const existing = transactions.find((t) => t.chainTransactionId === txId.toString());
        if (existing) {
            continue; // Already recorded
        }

        try {
            const txRecord = await escrow.getTransaction(txId);
            const land = lands.find((l) => l.id === landId);
            const seller = users.find((u) => u.id === txRecord.sellerId);
            const buyer = users.find((u) => u.id === txRecord.buyerId);

            const statusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];
            const status = statusMap[txRecord.status] || "Unknown";

            const newTx = {
                id: transactions.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1,
                chainTransactionId: txId.toString(),
                timestamp: new Date(Number(txRecord.timestamp) * 1000).toISOString(),
                type: "Purchase",
                landId: land ? land.id : landId,
                landTitle: land ? land.title : "Unknown",
                sellerId: txRecord.sellerId,
                sellerName: seller ? seller.fullName : "Unknown",
                buyerId: txRecord.buyerId,
                buyerName: buyer ? buyer.fullName : "Unknown",
                amount: hre.ethers.formatEther(txRecord.amount),
                status: status,
                blockNumber: event.blockNumber,
            };

            transactions.push(newTx);
            newCount++;
            console.log(`[${newTx.id}] Recorded: ${newTx.landTitle} - ${newTx.sellerName} → ${newTx.buyerName} (${newTx.amount} ETH)`);
        } catch (err) {
            console.error(`Failed to sync transaction ${txId}: ${err.message}`);
        }
    }

    saveTransactions(transactions);

    console.log(`\n✓ Synced ${newCount} new transactions`);
    console.log(`✓ Total transactions stored: ${transactions.length}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
