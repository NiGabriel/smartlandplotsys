const { loadUsers, loadLands, saveLands } = require("./dataHelpers");

const [title, location, sizeArg, ownerWallet] = process.argv.slice(2);

if (!title || !location || !sizeArg || !ownerWallet) {
    console.error("Usage: npm run add-land -- \"Title\" \"Location\" <Size> \"OwnerWallet\"");
    process.exit(1);
}

const size = Number(sizeArg);
if (!Number.isInteger(size) || size <= 0) {
    console.error("Size must be a positive integer.");
    process.exit(1);
}

const users = loadUsers();
const owner = users.find((user) => user.wallet.toLowerCase() === ownerWallet.toLowerCase());
if (!owner) {
    console.error("Owner wallet not found in data/users.txt. Add the user first.");
    process.exit(1);
}

const lands = loadLands();
const nextId = lands.reduce((max, land) => Math.max(max, land.id || 0), 0) + 1;
const newLand = {
    id: nextId,
    title,
    location,
    size,
    ownerId: owner.id,
    price: 0,
    status: "Registered",
    exists: true,
};

lands.push(newLand);
saveLands(lands);

console.log("Added land:", JSON.stringify(newLand, null, 2));
