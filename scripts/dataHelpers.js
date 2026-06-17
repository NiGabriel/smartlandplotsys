const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../data/users.txt");
const landsFile = path.join(__dirname, "../data/lands.txt");
const accountsFile = path.join(__dirname, "../data/accounts.txt");
const transactionsFile = path.join(__dirname, "../data/transactions.txt");

function readJsonFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) {
        return [];
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to parse JSON from ${filePath}: ${error.message}`);
    }
}

function writeJsonFile(filePath, data) {
    const formatted = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, formatted + "\n", "utf8");
}

function loadUsers() {
    return readJsonFile(usersFile);
}

function saveUsers(users) {
    writeJsonFile(usersFile, users);
}

function loadLands() {
    return readJsonFile(landsFile);
}

function saveLands(lands) {
    writeJsonFile(landsFile, lands);
}

function loadAccounts() {
    return readJsonFile(accountsFile);
}

function saveAccounts(accounts) {
    writeJsonFile(accountsFile, accounts);
}

function loadTransactions() {
    return readJsonFile(transactionsFile);
}

function saveTransactions(transactions) {
    writeJsonFile(transactionsFile, transactions);
}

function addTransaction(txData) {
    const transactions = loadTransactions();
    const nextId = transactions.reduce((max, tx) => Math.max(max, tx.id || 0), 0) + 1;
    const newTx = {
        id: nextId,
        timestamp: new Date().toISOString(),
        ...txData,
    };
    transactions.push(newTx);
    saveTransactions(transactions);
    return newTx;
}

module.exports = {
    loadUsers,
    saveUsers,
    loadLands,
    saveLands,
    loadAccounts,
    saveAccounts,
    loadTransactions,
    saveTransactions,
    addTransaction,
};
