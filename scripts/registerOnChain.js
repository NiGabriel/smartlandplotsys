const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error("Usage: node scripts/registerOnChain.js <contractAddress> [--impersonate]");
        process.exit(1);
    }

    const contractAddress = args[0];
    const impersonate = args.includes("--impersonate");

    const usersFile = path.join(__dirname, "../data/users.txt");
    const landsFile = path.join(__dirname, "../data/lands.txt");

    function readJson(filePath) {
        if (!fs.existsSync(filePath)) return [];
        const c = fs.readFileSync(filePath, "utf8").trim();
        if (!c) return [];
        return JSON.parse(c);
    }

    const users = readJson(usersFile);
    const lands = readJson(landsFile);

    const [deployer] = await hre.ethers.getSigners();
    const escrow = await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, deployer);

    const walletToOnchainUserId = {};

    const roleMap = {
        Seller: 0,
        Buyer: 1,
        Registrar: 2,
        0: 0,
        1: 1,
        2: 2,
    };

    console.log(`Found ${users.length} users and ${lands.length} lands in data/`);

    for (const user of users) {
        const wallet = user.wallet;
        try {
            const role = roleMap[user.role] ?? roleMap[String(user.role)];
            if (role === undefined) {
                console.log(`Skipping user ${user.fullName}: unknown role ${user.role}`);
                continue;
            }

            const contractWithSigner = escrow.connect(deployer);
            console.log(`Registering user ${user.fullName} as ${wallet}`);
            const tx = await contractWithSigner.registerUser(user.fullName, wallet, role);
            const receipt = await tx.wait();
            const iface = contractWithSigner.interface;
            const log = receipt.logs.find((l) => {
                try {
                    return iface.parseLog(l).name === "UserRegistered";
                } catch {
                    return false;
                }
            });
            let onchainId = null;
            if (log) {
                const parsed = iface.parseLog(log);
                onchainId = parsed.args[0].toNumber ? parsed.args[0].toNumber() : Number(parsed.args[0]);
                console.log(` -> registered with id ${onchainId}`);
                walletToOnchainUserId[wallet.toLowerCase()] = onchainId;
            } else {
                console.log(" -> no UserRegistered event found (maybe already registered)");
            }
        } catch (err) {
            console.error(`Failed registering user ${user.fullName} (${user.wallet}): ${err.message}`);
        }
    }

    // Register lands
    for (const land of lands) {
        const ownerWallet = land.ownerWallet || null;
        // try to use owner wallet from data; if not present try mapping from ownerId or owner
        let wallet = ownerWallet;
        let ownerId = land.ownerId || land.owner || null;

        if (!wallet && ownerId) {
            // try to locate user by id in users array
            const u = users.find((x) => x.id === ownerId);
            if (u) wallet = u.wallet;
        }

        if (!wallet) {
            console.log(`Skipping land ${land.title} - owner wallet not found in data`);
            continue;
        }

        try {
            const contractWithSigner = escrow.connect(deployer);
            console.log(`Registering land ${land.title} for owner id ${land.ownerId}`);
            const tx = await contractWithSigner.registerLand(
                land.title,
                land.location,
                land.size,
                land.ownerId
            );
            const receipt = await tx.wait();
            const iface = contractWithSigner.interface;
            const log = receipt.logs.find((l) => {
                try {
                    return iface.parseLog(l).name === "LandRegistered";
                } catch {
                    return false;
                }
            });
            let onchainLandId = null;
            if (log) {
                const parsed = iface.parseLog(log);
                onchainLandId = parsed.args[0].toNumber ? parsed.args[0].toNumber() : Number(parsed.args[0]);
                console.log(` -> land registered with id ${onchainLandId}`);
            } else {
                console.log(" -> no LandRegistered event found (maybe already registered)");
            }

            // If price present and > 0, list the land
            if (land.price && Number(land.price) > 0 && onchainLandId) {
                console.log(` -> listing land ${onchainLandId} for price ${land.price}`);
                if (!wallet) {
                    console.log(` -> cannot list land ${land.title}: owner wallet missing`);
                } else {
                    await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [wallet] });
                    const signer = await hre.ethers.getSigner(wallet);
                    const listTx = await escrow.connect(signer).listLand(onchainLandId, hre.ethers.parseEther(String(land.price)));
                    await listTx.wait();
                    console.log(` -> listed land ${onchainLandId}`);
                    await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [wallet] });
                }
            }
        } catch (err) {
            console.error(`Failed registering land ${land.title}: ${err.message}`);
        }
    }

    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
