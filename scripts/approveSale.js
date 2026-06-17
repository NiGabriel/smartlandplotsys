const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");
const { loadTransactions, saveTransactions } = require("./dataHelpers");

async function main() {
    const [contractAddress, transactionIdArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !transactionIdArg) {
        console.error("Usage: npm run approve-sale -- <contractAddress> <transactionId> [registrarAddress]");
        process.exit(1);
    }

    const transactionId = Number(transactionIdArg);
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        console.error("transactionId must be a positive integer.");
        process.exit(1);
    }

    const signer = await resolveSigner(signerAddress);
    const escrow = await getEscrowContract(contractAddress, signer);

    const tx = await escrow.approveSale(transactionId);
    await tx.wait();

    const tr = await escrow.getTransaction(transactionId);

    const statusMap = {
        0: "Created",
        1: "Funded",
        2: "Approved",
        3: "Completed",
        4: "Cancelled"
    };

    const transactions = loadTransactions();

    const localTx = transactions.find(
        (t) => Number(t.transactionId) === transactionId
    );

    if (localTx) {
        localTx.status = statusMap[tr.status];
        localTx.updatedAt = new Date().toISOString();

        saveTransactions(transactions);
    }

    console.log(`Approved sale for transaction ${transactionId} as registrar ${await signer.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});