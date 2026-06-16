const hre = require("hardhat");

async function main() {
    const LandSaleEscrow = await hre.ethers.getContractFactory("LandSaleEscrow");
    const escrow = await LandSaleEscrow.deploy();
    await escrow.waitForDeployment();

    console.log("LandSaleEscrow deployed to:", escrow.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
