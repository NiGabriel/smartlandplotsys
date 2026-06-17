const { loadAccounts, loadUsers } = require("./dataHelpers");

function printAccounts() {
    const accounts = loadAccounts();
    const users = loadUsers();

    console.log("\n=== Accounts ===");

    if (accounts.length === 0) {
        console.log("No accounts found.");
        return;
    }

    accounts.forEach((account) => {
        const user = users.find((u) => u.id === account.userId);
        console.log(`\nID: ${account.id}`);
        console.log(`  Wallet: ${account.wallet}`);
        console.log(`  Private Key: ${account.privateKey}`);
        console.log(`  Initial Balance: ${account.initialBalance} ETH`);
        console.log(`  Linked to User: ${user ? `${user.fullName} (ID: ${user.id}, Role: ${user.role})` : "Not linked"}`);
        console.log(`  Created: ${account.createdAt}`);
        if (account.linkedAt) {
            console.log(`  Linked at: ${account.linkedAt}`);
        }
    });
}

printAccounts();
