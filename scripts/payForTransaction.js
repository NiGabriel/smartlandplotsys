const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");
const { addTransaction, loadTransactions, saveTransactions } = require("./dataHelpers");
async function main() {
    const [contractAddress, transactionIdArg, amountArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !transactionIdArg || !amountArg) {
        console.error("Usage: npm run pay-transaction -- <contractAddress> <transactionId> <amountInEther> [buyerAddress]");
        process.exit(1);
    }

    const transactionId = Number(transactionIdArg);
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        console.error("transactionId must be a positive integer.");
        process.exit(1);
    }

    const value = hre.ethers.parseEther(amountArg);
    const signer = await resolveSigner(signerAddress);
    const escrow = await getEscrowContract(contractAddress, signer);

    const tx = await escrow.payForTransaction(transactionId, { value });
    await tx.wait();

    const tr = await escrow.getTransaction(transactionId);

    const transactions = loadTransactions();

    const localTx = transactions.find(
        (t) => Number(t.transactionId) === transactionId
    );

    if (localTx) {
        localTx.status = "Funded";
        localTx.amount = hre.ethers.formatEther(tr.amount);
        localTx.updatedAt = new Date().toISOString();

        saveTransactions(transactions);
    }
    console.log(`Paid ${amountArg} ETH for transaction ${transactionId} using signer ${await signer.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});