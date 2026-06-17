const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");
const { loadLands, saveLands } = require("./dataHelpers");

async function main() {
    const [contractAddress, transactionIdArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !transactionIdArg) {
        console.error("Usage: npm run finalize-transaction -- <contractAddress> <transactionId> [registrarAddress]");
        process.exit(1);
    }

    const transactionId = Number(transactionIdArg);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        console.error("transactionId must be a positive integer.");
        process.exit(1);
    }

    const signer = await resolveSigner(signerAddress);
    const escrow = await getEscrowContract(contractAddress, signer);

    const tx = await escrow.finalizeTransaction(transactionId);
    await tx.wait();

    // source of truth from blockchain
    const tr = await escrow.getTransaction(transactionId);

    const lands = loadLands();

    const land = lands.find((l) => l.id === Number(tr.landId));

    if (land) {
        land.status = "Sold";
        land.ownerId = Number(tr.buyerId);
        land.updatedAt = new Date().toISOString();

        saveLands(lands);
    }

    console.log(
        `Finalized transaction ${transactionId} as registrar ${await signer.getAddress()}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});