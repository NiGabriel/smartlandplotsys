const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");
const { loadLands } = require("./dataHelpers");
const { addTransaction } = require("./dataHelpers");

async function main() {
    const [contractAddress, landIdArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: node scripts/initiatePurchase.js <contractAddress> <landId> [buyerAddress]");
        process.exit(1);
    }

    const lands = loadLands();
    const land = lands.find((l) => l.id === Number(landIdArg));

    const landId = Number(landIdArg);
    if (!land) {
        console.error(`Land ${landIdArg} not found in local storage.`);
        process.exit(1);
    }
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
        process.exit(1);
    }
    if (land.status !== "Listed") {
        console.error(`Land ${landId} is not listed for sale.`);
        process.exit(1);
    }

    const signer = await resolveSigner(signerAddress);
    const escrow = await getEscrowContract(contractAddress, signer);

    const tx = await escrow.initiatePurchase(landId);
    const receipt = await tx.wait();
    const iface = escrow.interface;
    const log = receipt.logs.find((l) => {
        try {
            return iface.parseLog(l).name === "PurchaseInitiated";
        } catch {
            return false;
        }
    });

    if (!log) {
        console.log("Purchase initiated, but no PurchaseInitiated event found.");
        return;
    }

    const parsed = iface.parseLog(log);
    const txId = parsed.args[0].toString();
    const tr = await escrow.getTransaction(txId);
    addTransaction({
        type: "PURCHASE_INITIATED",
        transactionId: tr.id.toString(),
        landId: tr.landId.toString(),
        sellerId: tr.sellerId.toString(),
        buyerId: tr.buyerId.toString(),
        amountWei: tr.amount.toString(),
        amountEth: hre.ethers.formatEther(tr.amount),
        status: "Created",
        txHash: receipt.hash,
        timestamp: new Date().toISOString()
    });
    console.log(`Purchase initiated for land ${landId}. Transaction ID: ${parsed.args[0].toString()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});