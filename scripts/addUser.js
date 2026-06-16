const { loadUsers, saveUsers } = require("./dataHelpers");

const [fullName, role, wallet] = process.argv.slice(2);

if (!fullName || !role || !wallet) {
    console.error("Usage: npm run add-user -- \"Full Name\" \"Role\" \"WalletAddress\"");
    process.exit(1);
}

const users = loadUsers();
const existing = users.find((user) => user.wallet.toLowerCase() === wallet.toLowerCase());
if (existing) {
    console.error("A user with that wallet address already exists.");
    process.exit(1);
}

const nextId = users.reduce((max, user) => Math.max(max, user.id || 0), 0) + 1;
const newUser = {
    id: nextId,
    fullName,
    wallet,
    role,
    exists: true,
};

users.push(newUser);
saveUsers(users);

console.log("Added user:", JSON.stringify(newUser, null, 2));
