const hre = require("hardhat");

async function main() {
    const [contractAddress, transactionIdArg] = process.argv.slice(2);

    if (!contractAddress || !transactionIdArg) {
        console.error("Usage: node scripts/getTransaction.js <contractAddress> <transactionId>");
        process.exit(1);
    }

    const transactionId = Number(transactionIdArg);
    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        console.error("transactionId must be a positive integer.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    const tx = await escrow.getTransaction(transactionId);
    console.log(JSON.stringify(tx, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});