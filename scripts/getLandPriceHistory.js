const hre = require("hardhat");

async function main() {
    const [contractAddress, landIdArg] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: npm run price-history -- <contractAddress> <landId>");
        process.exit(1);
    }

    const landId = Number(landIdArg);
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt(
        "LandSaleEscrow",
        contractAddress,
        provider
    );

    // ----------------------------
    // ENUM MAPPERS
    // ----------------------------
    const landStatusMap = ["Registered", "Listed", "Sold"];
    const txStatusMap = ["Created", "Funded", "Approved", "Completed", "Cancelled"];

    // ----------------------------
    // GET LAND DETAILS
    // ----------------------------
    const land = await escrow.getLand(landId);

    console.log("\n=== LAND DETAILS ===");
    console.log(`ID: ${land.id.toString()}`);
    console.log(`Title: ${land.title}`);
    console.log(`Location: ${land.location}`);
    console.log(`Size: ${land.size.toString()}`);
    console.log(`Owner ID: ${land.ownerId.toString()}`);
    console.log(`Status: ${landStatusMap[Number(land.status)]}`);

    const priceValue = Number(land.price);
    console.log(
        `Current Listed Price: ${priceValue === 0
            ? "Not listed"
            : hre.ethers.formatEther(land.price) + " ETH"
        }`
    );

    // ----------------------------
    // FETCH TRANSACTIONS
    // ----------------------------
    const filter = escrow.filters.PurchaseInitiated(null, landId);
    const events = await escrow.queryFilter(filter);

    if (events.length === 0) {
        console.log("\n=== PRICE / TRANSACTION HISTORY ===");
        console.log("No transactions found for this land.");
        return;
    }

    console.log("\n=== PRICE / TRANSACTION HISTORY ===\n");

    const history = [];

    for (const event of events) {
        const txId = Number(event.args[0]);

        try {
            const txRecord = await escrow.getTransaction(txId);

            history.push({
                txId: Number(txRecord.id),
                landId: Number(txRecord.landId),
                price: txRecord.amount,
                status: txStatusMap[Number(txRecord.status)],
                timestamp: Number(txRecord.timestamp),
                sellerId: Number(txRecord.sellerId),
                buyerId: Number(txRecord.buyerId),
            });
        } catch (err) {
            console.warn(`⚠ Skipping transaction ${txId} (not found on-chain)`);
        }
    }

    // Sort by time
    history.sort((a, b) => a.timestamp - b.timestamp);

    // ----------------------------
    // PRINT HISTORY
    // ----------------------------
    history.forEach((entry, index) => {
        console.log(`[${index + 1}] Transaction ID: ${entry.txId}`);
        console.log(`    Date: ${new Date(entry.timestamp * 1000).toISOString()}`);
        console.log(
            `    Price: ${hre.ethers.formatEther(entry.price)} ETH`
        );
        console.log(`    Status: ${entry.status}`);

        if (entry.status === "Completed") {
            console.log(`    ✓ SOLD - Ownership transferred`);
        }

        console.log("");
    });

    // ----------------------------
    // CURRENT OWNER INFO
    // ----------------------------
    try {
        const currentOwner = await escrow.getUser(land.ownerId);

        const roleMap = ["Registrar", "Seller", "Buyer"];

        console.log("\n=== CURRENT OWNERSHIP ===");
        console.log(`Owner Name: ${currentOwner.fullName}`);
        console.log(`Wallet: ${currentOwner.wallet}`);
        console.log(`Role: ${roleMap[Number(currentOwner.role)]}`);
    } catch (err) {
        console.log("\nCould not retrieve owner details.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});