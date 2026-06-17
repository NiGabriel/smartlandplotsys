const hre = require("hardhat");

async function main() {
    const [contractAddress, landIdArg] = process.argv.slice(2);

    if (!contractAddress || !landIdArg) {
        console.error("Usage: node scripts/getLand.js <contractAddress> <landId>");
        process.exit(1);
    }

    const landId = Number(landIdArg);
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, provider);

    const land = await escrow.getLand(landId);
    console.log(JSON.stringify(land, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});