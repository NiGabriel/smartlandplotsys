const { loadLands } = require("./dataHelpers");

function getLandsForSale() {
    const lands = loadLands();

    // Filter lands that are listed for sale
    const listedLands = lands.filter(
        (land) => land.exists && land.status === "Listed"
    );

    return listedLands;
}

const landsForSale = getLandsForSale();

if (landsForSale.length === 0) {
    console.log("No lands currently available for sale.");
} else {
    console.log("=== Lands Available for Sale ===\n");

    landsForSale.forEach((land) => {
        console.log(`ID: ${land.id}`);
        console.log(`Title: ${land.title}`);
        console.log(`Location: ${land.location}`);
        console.log(`Size: ${land.size}`);
        console.log(`Price: ${land.price}`);
        console.log(`Owner ID: ${land.ownerId}`);
        console.log(`Status: ${land.status}`);
        console.log("-----------------------------------");
    });
}