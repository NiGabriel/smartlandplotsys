const hre = require("hardhat");

async function main() {
    const [contractAddress] = process.argv.slice(2);

    if (!contractAddress) {
        console.error("Usage: node scripts/getDashboard.js <contractAddress>");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     Land Escrow System Dashboard      ║");
    console.log("╚════════════════════════════════════════╝\n");

    // Get all users
    const userFilter = escrow.filters.UserRegistered();
    const userEvents = await escrow.queryFilter(userFilter);

    // Get all lands
    const landFilter = escrow.filters.LandRegistered();
    const landEvents = await escrow.queryFilter(landFilter);

    // Get all transactions
    const txFilter = escrow.filters.PurchaseInitiated();
    const txEvents = await escrow.queryFilter(txFilter);

    console.log(`📊 System Overview`);
    console.log(`   Users: ${userEvents.length}`);
    console.log(`   Lands: ${landEvents.length}`);
    console.log(`   Transactions: ${txEvents.length}\n`);

    // User summary
    console.log(`\n👥 Users Summary`);
    const uniqueUserIds = new Set();
    const sellers = [];
    const buyers = [];
    const registrars = [];

    for (const event of userEvents) {
        const userId = event.args[0];
        uniqueUserIds.add(userId.toString());
        try {
            const user = await escrow.getUser(userId);
            const roleMap = ["Seller", "Buyer", "Registrar"];
            const role = roleMap[user.role] || "Unknown";
            if (role === "Seller") sellers.push({ id: userId, name: user.fullName });
            else if (role === "Buyer") buyers.push({ id: userId, name: user.fullName });
            else if (role === "Registrar") registrars.push({ id: userId, name: user.fullName });
        } catch (err) {
            // User not found
        }
    }

    console.log(`   Sellers: ${sellers.length}`);
    sellers.forEach((s) => console.log(`     - ${s.name} (ID: ${s.id})`));
    console.log(`   Buyers: ${buyers.length}`);
    buyers.forEach((b) => console.log(`     - ${b.name} (ID: ${b.id})`));
    console.log(`   Registrars: ${registrars.length}`);
    registrars.forEach((r) => console.log(`     - ${r.name} (ID: ${r.id})`));

    // Land summary
    console.log(`\n🏠 Lands Summary`);
    const listedLands = [];
    const soldLands = [];
    const unlistedLands = [];

    for (const event of landEvents) {
        const landId = event.args[0];
        try {
            const land = await escrow.getLand(landId);
            if (land.status === "Sold") {
                soldLands.push(land);
            } else if (land.status === "Listed") {
                listedLands.push(land);
            } else {
                unlistedLands.push(land);
            }
        } catch (err) {
            // Land not found
        }
    }

    console.log(`   Total Lands: ${landEvents.length}`);
    console.log(`   Listed for Sale: ${listedLands.length}`);
    listedLands.forEach((l) => console.log(`     - ${l.title} @ ${hre.ethers.formatEther(l.price)} ETH (${l.size} sqm)`));
    console.log(`   Sold: ${soldLands.length}`);
    console.log(`   Not Listed: ${unlistedLands.length}`);

    // Transaction summary
    console.log(`\n💱 Transaction Summary`);
    const statusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];
    const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalVolume = 0n;
    let completedCount = 0;

    for (const event of txEvents) {
        const txId = event.args[0];
        try {
            const tx = await escrow.getTransaction(txId);
            statusCounts[tx.status]++;
            if (tx.status === 3) {
                totalVolume += tx.amount;
                completedCount++;
            }
        } catch (err) {
            // Transaction not found
        }
    }

    Object.keys(statusCounts).forEach((status) => {
        console.log(`   ${statusMap[status]}: ${statusCounts[status]}`);
    });
    console.log(`\n   Completed Transactions: ${completedCount}`);
    console.log(`   Total Volume: ${hre.ethers.formatEther(totalVolume)} ETH`);

    console.log(`\n════════════════════════════════════════\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});