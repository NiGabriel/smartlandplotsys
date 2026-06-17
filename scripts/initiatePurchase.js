const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");

async function main() {
    const [contractAddress, landIdArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: node scripts/initiatePurchase.js <contractAddress> <landId> [buyerAddress]");
        process.exit(1);
    }

    const landId = Number(landIdArg);
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
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
    console.log(`Purchase initiated for land ${landId}. Transaction ID: ${parsed.args[0].toString()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});