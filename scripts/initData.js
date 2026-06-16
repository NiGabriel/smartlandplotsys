const { saveUsers, saveLands } = require("./dataHelpers");

const defaultUsers = [
    {
        id: 1,
        fullName: "Gabriel N.",
        wallet: "0x0000000000000000000000000000000000000001",
        role: "Seller",
        exists: true,
    },
    {
        id: 2,
        fullName: "Asha K.",
        wallet: "0x0000000000000000000000000000000000000002",
        role: "Buyer",
        exists: true,
    },
];

const defaultLands = [
    {
        id: 1,
        title: "Riverfront Plot",
        location: "Sector 5",
        size: 120,
        ownerId: 1,
        price: 0,
        status: "Registered",
        exists: true,
    },
    {
        id: 2,
        title: "Hillside Acre",
        location: "East Hill",
        size: 200,
        ownerId: 1,
        price: 0,
        status: "Registered",
        exists: true,
    },
];

saveUsers(defaultUsers);
saveLands(defaultLands);

console.log("Initialized dummy data files in data/users.txt and data/lands.txt");
