const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");

async function main() {
    const [contractAddress, transactionIdArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !transactionIdArg) {
        console.error("Usage: node scripts/finalizeTransaction.js <contractAddress> <transactionId> [registrarAddress]");
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

    console.log(`Finalized transaction ${transactionId} as registrar ${await signer.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});