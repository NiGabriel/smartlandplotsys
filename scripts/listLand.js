const hre = require("hardhat");
const { getEscrowContract, resolveSigner } = require("./contractHelpers");
const { loadLands, saveLands } = require("./dataHelpers");

async function main() {
    const [contractAddress, landIdArg, priceArg, signerAddress] = process.argv.slice(2);

    if (!contractAddress || !landIdArg || !priceArg) {
        console.error("Usage: node scripts/listLand.js <contractAddress> <landId> <priceInEther> [signerAddress]");
        process.exit(1);
    }

    const landId = Number(landIdArg);
    if (!Number.isInteger(landId) || landId <= 0) {
        console.error("landId must be a positive integer.");
        process.exit(1);
    }

    const price = hre.ethers.parseEther(priceArg);
    const signer = await resolveSigner(signerAddress);
    const escrow = await getEscrowContract(contractAddress, signer);

    const tx = await escrow.listLand(landId, price);
    await tx.wait();

    const lands = loadLands();
    const landIn = lands.find((l) => l.id === landId);

    if (landIn) {
        landIn.status = "Listed";
        landIn.price = Number(priceArg);
        saveLands(lands);
    }

    console.log(`Land ${landId} listed for ${priceArg} ETH with signer ${await signer.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});