const { saveUsers, saveLands } = require("./dataHelpers");

const defaultUsers = [
    {
        id: 1,
        fullName: "MAHEREZO Joseph",
        wallet: "0x0000000000000000000000000000000000000001",
        role: "Seller",
        exists: true,
    },
    {
        id: 2,
        fullName: "Aisha Kagwa",
        wallet: "0x0000000000000000000065000000000000000002",
        role: "Buyer",
        exists: true,
    },
];

const defaultLands = [
    {
        id: 1,
        title: "Masaka Plot",
        location: "Kigali City",
        size: 120,
        ownerId: 1,
        price: 0,
        status: "Registered",
        exists: true,
    },
    {
        id: 2,
        title: "Nyagatare Plot",
        location: "Eastern Province",
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
