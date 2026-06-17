const { saveUsers, saveLands, loadAccounts } = require("./dataHelpers");

const accounts = loadAccounts();

function walletFor(accountId) {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) {
        throw new Error(`No account with id ${accountId} in data/accounts.txt. Run "npm run init-accounts" first.`);
    }
    return account.wallet;
}

const defaultUsers = [
    {
        id: 1,
        fullName: "MAHEREZO Joseph",
        wallet: walletFor(1),
        role: "Seller",
        exists: true,
    },
    {
        id: 2,
        fullName: "Aisha Kagwa",
        wallet: walletFor(2),
        role: "Buyer",
        exists: true,
    },
];

const defaultLands = [
    { id: 1, title: "Masaka Plot", location: "Kigali City", size: 120, ownerId: 1, price: 0, status: "Registered", exists: true },
    { id: 2, title: "Nyagatare Plot", location: "Eastern Province", size: 200, ownerId: 1, price: 0, status: "Registered", exists: true },
];

saveUsers(defaultUsers);
saveLands(defaultLands);

console.log("Initialized data/users.txt and data/lands.txt with wallets matched to data/accounts.txt");