const { loadAccounts, saveAccounts, loadUsers, saveUsers } = require("./dataHelpers");

const [accountIdArg, userIdArg] = process.argv.slice(2);

if (!accountIdArg || !userIdArg) {
    console.error("Usage: npm run link-account -- <accountId> <userId>");
    process.exit(1);
}

const accountId = Number(accountIdArg);
const userId = Number(userIdArg);

if (!Number.isInteger(accountId) || accountId <= 0) {
    console.error("accountId must be a positive integer.");
    process.exit(1);
}

if (!Number.isInteger(userId) || userId <= 0) {
    console.error("userId must be a positive integer.");
    process.exit(1);
}

const accounts = loadAccounts();
const account = accounts.find((acc) => acc.id === accountId);

if (!account) {
    console.error(`Account with ID ${accountId} not found.`);
    process.exit(1);
}

const users = loadUsers();

const user = users.find((u) => u.id === userId);

if (!user) {
    console.error(`User with ID ${userId} not found.`);
    process.exit(1);
}

account.userId = userId;
account.linkedAt = new Date().toISOString();

user.wallet = account.wallet;

saveAccounts(accounts);
saveUsers(users);

console.log(
    `Linked account ${accountId} to user ${userId} and synchronized wallet.`
);

console.log("Account:");
console.log(JSON.stringify(account, null, 2));

console.log("User:");
console.log(JSON.stringify(user, null, 2));