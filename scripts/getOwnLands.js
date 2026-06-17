const { loadLands } = require("./dataHelpers");

function getOwnLands(userId) {
    const lands = loadLands();

    // Filter lands owned by the user
    const ownedLands = lands.filter(
        (land) => land.ownerId === userId
    );

    return ownedLands;
}

const [userIdArg] = process.argv.slice(2);

const userIdCast = Number(userIdArg);

if (!userIdCast) {
    console.error("Usage: npm run get-own-lands <userId>");
    process.exit(1);
}
if (!Number.isInteger(userIdCast) || userIdCast <= 0) {
    console.error("userId must be a positive integer.");
    process.exit(1);
}

// Example usage (you must define userId or pass it via CLI)
const userId = userIdCast;

const ownLands = getOwnLands(userId);

if (ownLands.length === 0) {
    console.log("No lands found for this user.");
} else {
    console.log("=== Lands Owned by User ===\n");

    ownLands.forEach((land) => {
        console.log(`ID: ${land.id}`);
        console.log(`Title: ${land.title}`);
        console.log(`Location: ${land.location}`);
        console.log(`Size: ${land.size}`);
        console.log(`Price: ${land.price}`);
        console.log(`Status: ${land.status}`);
        console.log("-----------------------------------");
    });
}