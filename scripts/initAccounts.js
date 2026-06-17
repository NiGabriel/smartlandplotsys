const hre = require("hardhat");
const { saveAccounts } = require("./dataHelpers");

async function makeAccount(id, initialBalance) {
    const wallet = hre.ethers.Wallet.createRandom();

    // Fund the wallet on the local node immediately, so it can pay gas
    // and send value without any manual console step.
    await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [wallet.address, hre.ethers.toQuantity(hre.ethers.parseEther(String(initialBalance)))],
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

    console.log("Initialized accounts with real key pairs and funded balances in data/accounts.txt");
    console.log("\nDefault Accounts:");
    defaultAccounts.forEach((acc) => {
        console.log(`  ID ${acc.id}: ${acc.wallet} (${acc.initialBalance} ETH)`);
    });
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});