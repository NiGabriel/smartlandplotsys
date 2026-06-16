const { loadUsers, loadLands } = require("./dataHelpers");

function printData() {
    const users = loadUsers();
    const lands = loadLands();

    console.log("\n=== Users ===");
    console.log(JSON.stringify(users, null, 2));

    console.log("\n=== Lands ===");
    console.log(JSON.stringify(lands, null, 2));
}

printData();
