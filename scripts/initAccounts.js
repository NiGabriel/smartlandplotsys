const { ethers } = require("ethers");
const hre = require("hardhat");
const { saveAccounts } = require("./dataHelpers");

async function makeAccount(id, initialBalance) {
    const wallet = ethers.Wallet.createRandom();

    await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [wallet.address, ethers.toQuantity(ethers.parseEther(String(initialBalance)))],
    });

    return {
        id,
        wallet: wallet.address,
        privateKey: wallet.privateKey,
        initialBalance,
        userId: null,
        createdAt: new Date().toISOString(),
    };
}

async function main() {
    const defaultAccounts = [
        await makeAccount(1, 100),
        await makeAccount(2, 50),
        await makeAccount(3, 75),
    ];

    saveAccounts(defaultAccounts);

    console.log("Initialized accounts with real key pairs in data/accounts.txt");
    console.log("\nDefault Accounts:");
    defaultAccounts.forEach((acc) => {
        console.log(`  ID ${acc.id}: ${acc.wallet} (${acc.initialBalance} ETH)`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});