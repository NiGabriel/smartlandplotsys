const { saveAccounts } = require("./dataHelpers");

const defaultAccounts = [
    {
        id: 1,
        wallet: "0x0000000000000000000000000000000000000001",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000001",
        initialBalance: 100,
        userId: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 2,
        wallet: "0x0000000000000000000000000000000000000002",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000002",
        initialBalance: 50,
        userId: null,
        createdAt: new Date().toISOString(),
    },
    {
        id: 3,
        wallet: "0x0000000000000000000000000000000000000003",
        privateKey: "0x0000000000000000000000000000000000000000000000000000000000000003",
        initialBalance: 75,
        userId: null,
        createdAt: new Date().toISOString(),
    },
];

saveAccounts(defaultAccounts);

console.log("Initialized dummy accounts in data/accounts.txt");
console.log("\nDefault Accounts:");
defaultAccounts.forEach((acc) => {
    console.log(`  ID ${acc.id}: ${acc.wallet} (${acc.initialBalance} ETH)`);
});
