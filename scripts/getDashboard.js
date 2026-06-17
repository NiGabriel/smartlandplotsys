const hre = require("hardhat");

async function main() {
    const [contractAddress] = process.argv.slice(2);

    if (!contractAddress) {
        console.error("Usage: npm run dashboard -- <contractAddress>");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt(
        "LandSaleEscrow",
        contractAddress,
        provider
    );

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     Land Escrow System Dashboard      ║");
    console.log("╚════════════════════════════════════════╝\n");

    // ----------------------------
    // ENUM MAPPERS
    // ----------------------------
    const roleMap = ["Seller", "Buyer", "Registrar"];
    const landStatusMap = ["Registered", "Listed", "Sold"];
    const txStatusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];

    // ----------------------------
    // EVENTS
    // ----------------------------
    const userEvents = await escrow.queryFilter(escrow.filters.UserRegistered());
    const landEvents = await escrow.queryFilter(escrow.filters.LandRegistered());
    const txEvents = await escrow.queryFilter(escrow.filters.PurchaseInitiated());

    console.log(`📊 System Overview`);
    console.log(`   Users: ${userEvents.length}`);
    console.log(`   Lands: ${landEvents.length}`);
    console.log(`   Transactions: ${txEvents.length}\n`);

    // ----------------------------
    // USERS
    // ----------------------------
    console.log(`\n👥 Users Summary`);

    const sellers = [];
    const buyers = [];
    const registrars = [];

    for (const event of userEvents) {
        const userId = Number(event.args[0]);

        try {
            const user = await escrow.getUser(userId);
            const role = roleMap[Number(user.role)] || "Unknown";

            if (role === "Seller") {
                sellers.push({ id: userId, name: user.fullName });
            } else if (role === "Buyer") {
                buyers.push({ id: userId, name: user.fullName });
            } else if (role === "Registrar") {
                registrars.push({ id: userId, name: user.fullName });
            }
        } catch { }
    }

    console.log(`   Sellers: ${sellers.length}`);
    sellers.forEach((s) =>
        console.log(`     - ${s.name} (ID: ${s.id})`)
    );

    console.log(`   Buyers: ${buyers.length}`);
    buyers.forEach((b) =>
        console.log(`     - ${b.name} (ID: ${b.id})`)
    );

    console.log(`   Registrars: ${registrars.length}`);
    registrars.forEach((r) =>
        console.log(`     - ${r.name} (ID: ${r.id})`)
    );

    // ----------------------------
    // LANDS
    // ----------------------------
    console.log(`\n🏠 Lands Summary`);

    const listedLands = [];
    const soldLands = [];
    const unlistedLands = [];

    for (const event of landEvents) {
        const landId = Number(event.args[0]);

        try {
            const land = await escrow.getLand(landId);
            const status = Number(land.status);

            if (status === 2) {
                soldLands.push(land);
            } else if (status === 1) {
                listedLands.push(land);
            } else {
                unlistedLands.push(land);
            }
        } catch { }
    }

    console.log(`   Total Lands: ${landEvents.length}`);

    console.log(`   Listed for Sale: ${listedLands.length}`);
    listedLands.forEach((l) =>
        console.log(
            `     - ${l.title} @ ${hre.ethers.formatEther(l.price)} ETH (${l.size} sqm)`
        )
    );

    console.log(`   Sold: ${soldLands.length}`);
    console.log(`   Not Listed: ${unlistedLands.length}`);

    // ----------------------------
    // TRANSACTIONS
    // ----------------------------
    console.log(`\n💱 Transaction Summary`);

    const statusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    let totalVolume = 0n;
    let completedCount = 0;

    for (const event of txEvents) {
        const txId = Number(event.args[0]);

        try {
            const tx = await escrow.getTransaction(txId);
            const status = Number(tx.status);

            statusCounts[status]++;

            if (status === 3) {
                totalVolume += BigInt(tx.amount);
                completedCount++;
            }
        } catch { }
    }

    Object.keys(statusCounts).forEach((s) => {
        console.log(`   ${txStatusMap[s]}: ${statusCounts[s]}`);
    });

    console.log(`\n   Completed Transactions: ${completedCount}`);
    console.log(
        `   Total Volume: ${hre.ethers.formatEther(totalVolume)} ETH`
    );

    console.log(`\n════════════════════════════════════════\n`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});