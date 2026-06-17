const hre = require("hardhat");

async function main() {
    const [contractAddress, userIdArg] = process.argv.slice(2);

    if (!contractAddress || !userIdArg) {
        console.error("Usage: node scripts/getUser.js <contractAddress> <userId>");
        process.exit(1);
    }

    const userId = Number(userIdArg);
    if (!Number.isInteger(userId) || userId <= 0) {
        console.error("userId must be a positive integer.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    const user = await escrow.getUser(userId);
    console.log(JSON.stringify(user, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});