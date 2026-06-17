const { loadUsers } = require("./dataHelpers");

function printData() {
    const users = loadUsers();
    

    console.log("\n=== Users ===");
    console.log(JSON.stringify(users, null, 2));

}

printData();
