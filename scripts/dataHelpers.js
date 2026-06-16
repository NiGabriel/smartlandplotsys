const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../data/users.txt");
const landsFile = path.join(__dirname, "../data/lands.txt");

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

module.exports = {
    loadUsers,
    saveUsers,
    loadLands,
    saveLands,
};
