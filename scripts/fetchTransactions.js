const { loadTransactions, loadUsers, loadLands } = require("./dataHelpers");

function printTransactions() {
    const transactions = loadTransactions();
    const users = loadUsers();
    const lands = loadLands();

    console.log("\n=== Recorded Transactions ===");

    if (transactions.length === 0) {
        console.log("No transactions recorded.");
        return;
    }

    console.log(`Total: ${transactions.length}\n`);

    transactions.forEach((tx) => {
        const seller = users.find((u) => u.id === tx.sellerId);
        const buyer = users.find((u) => u.id === tx.buyerId);
        const land = lands.find((l) => l.id === tx.landId);

        console.log(`[${tx.id}] ${tx.timestamp}`);
        console.log(`  Type: ${tx.type}`);
        console.log(`  Land: ${land ? land.title : "Unknown"} (ID: ${tx.landId})`);
        console.log(`  Seller: ${seller ? seller.fullName : "Unknown"} (ID: ${tx.sellerId})`);
        console.log(`  Buyer: ${buyer ? buyer.fullName : "Unknown"} (ID: ${tx.buyerId})`);
        console.log(`  Amount: ${tx.amount} ETH`);
        console.log(`  Status: ${tx.status}`);
        if (tx.blockNumber) {
            console.log(`  Block: ${tx.blockNumber}`);
        }
        if (tx.txHash) {
            console.log(`  Tx Hash: ${tx.txHash}`);
        }
        console.log();
    });
}

printTransactions();
