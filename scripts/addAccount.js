const { loadAccounts, saveAccounts } = require("./dataHelpers");

const [wallet, privateKey, balanceArg, userIdArg] = process.argv.slice(2);

if (!wallet || !privateKey || !balanceArg) {
    console.error("Usage: npm run add-account -- \"0xWallet\" \"PrivateKey\" <InitialBalanceInETH> [userId]");
    process.exit(1);
}

// Validate wallet format
if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    console.error("Wallet must be a valid Ethereum address (0x followed by 40 hex characters).");
    process.exit(1);
}

// Validate private key format
if (!/^[a-fA-F0-9]{64}$/.test(privateKey.replace(/^0x/, ""))) {
    console.error("Private key must be 64 hex characters (with or without 0x prefix).");
    process.exit(1);
}

const balance = Number(balanceArg);
if (!Number.isFinite(balance) || balance < 0) {
    console.error("Initial balance must be a non-negative number (in ETH).");
    process.exit(1);
}

const accounts = loadAccounts();
const existing = accounts.find((acc) => acc.wallet.toLowerCase() === wallet.toLowerCase());
if (existing) {
    console.error("An account with that wallet address already exists.");
    process.exit(1);
}

const nextId = accounts.reduce((max, acc) => Math.max(max, acc.id || 0), 0) + 1;
const normalizedKey = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;

const newAccount = {
    id: nextId,
    wallet: wallet.toLowerCase(),
    privateKey: normalizedKey,
    initialBalance: balance,
    userId: userIdArg ? Number(userIdArg) : null,
    createdAt: new Date().toISOString(),
};

accounts.push(newAccount);
saveAccounts(accounts);

console.log("Added account:", JSON.stringify(newAccount, null, 2));
