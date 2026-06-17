const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function isValidAddress(address) {
    return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function assertContractAddress(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid Ethereum address: ${address}`);
    }

    const provider = hre.ethers.provider;
    const code = await provider.getCode(address);
    if (!code || code === "0x" || code.length <= 2) {
        throw new Error(`No contract found at ${address}. Make sure this is the deployed contract address, not an account address.`);
    }
}

function loadAccounts() {
    const accountsPath = path.join(__dirname, "../data/accounts.txt");
    if (!fs.existsSync(accountsPath)) {
        return [];
    }

    const content = fs.readFileSync(accountsPath, "utf8").trim();
    if (!content) {
        return [];
    }

    try {
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to parse JSON from ${accountsPath}: ${error.message}`);
    }
}

async function resolveSigner(signerInput) {
    const provider = hre.ethers.provider;

    if (!signerInput) {
        return (await hre.ethers.getSigners())[0];
    }

    if (/^0x[a-fA-F0-9]{64}$/.test(signerInput)) {
        return new hre.ethers.Wallet(signerInput, provider);
    }

    if (!isValidAddress(signerInput)) {
        throw new Error(`Signer must be an address or private key; got: ${signerInput}`);
    }

    try {
        return await hre.ethers.getSigner(signerInput);
    } catch (_err) {
        const accounts = loadAccounts();
        const account = accounts.find((acc) => acc.wallet.toLowerCase() === signerInput.toLowerCase());
        if (account && account.privateKey) {
            return new hre.ethers.Wallet(account.privateKey, provider);
        }
        throw new Error(`Unable to resolve signer for address ${signerInput}. Make sure the address is unlocked in Hardhat or listed in data/accounts.txt with a private key.`);
    }
}

async function getEscrowContract(contractAddress, signerOrProvider) {
    await assertContractAddress(contractAddress);
    return await hre.ethers.getContractAt("LandSaleEscrow", contractAddress, signerOrProvider || hre.ethers.provider);
}

module.exports = {
    assertContractAddress,
    resolveSigner,
    getEscrowContract,
};