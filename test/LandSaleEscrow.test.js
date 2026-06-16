const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandSaleEscrow", function () {
    let LandSaleEscrow;
    let escrow;
    let owner;
    let seller;
    let buyer;

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();
        LandSaleEscrow = await ethers.getContractFactory("LandSaleEscrow");
        escrow = await LandSaleEscrow.deploy();
        await escrow.waitForDeployment();
    });

    it("should set registrar to deployer", async function () {
        expect(await escrow.registrar()).to.equal(owner.address);
    });

    it("should register a user and emit UserRegistered", async function () {
        await expect(escrow.connect(seller).registerUser("Seller One", 0))
            .to.emit(escrow, "UserRegistered")
            .withArgs(1, seller.address);

        const user = await escrow.getUser(1);
        expect(user.id).to.equal(1);
        expect(user.fullName).to.equal("Seller One");
        expect(user.wallet).to.equal(seller.address);
        expect(user.role).to.equal(0);
        expect(user.exists).to.equal(true);
    });

    it("should register land for an existing user and emit LandRegistered", async function () {
        await escrow.connect(seller).registerUser("Seller One", 0);

        await expect(
            escrow.connect(seller).registerLand("Green Plot", "Sector 7", 150)
        )
            .to.emit(escrow, "LandRegistered")
            .withArgs(1, 1);

        const land = await escrow.getLand(1);
        expect(land.id).to.equal(1);
        expect(land.title).to.equal("Green Plot");
        expect(land.location).to.equal("Sector 7");
        expect(land.size).to.equal(150);
        expect(land.ownerId).to.equal(1);
        expect(land.price).to.equal(0);
        expect(land.status).to.equal(0);
        expect(land.exists).to.equal(true);
    });

    it("should revert when trying to register land with an unregistered address", async function () {
        await expect(
            escrow.connect(buyer).registerLand("Bad Plot", "Nowhere", 100)
        ).to.be.revertedWithCustomError(escrow, "UserNotFound");
    });

    it("should revert when trying to get a non-existent user", async function () {
        await expect(escrow.getUser(999)).to.be.revertedWithCustomError(escrow, "UserNotFound");
    });

    it("should revert when trying to get a non-existent land record", async function () {
        await expect(escrow.getLand(999)).to.be.revertedWithCustomError(escrow, "LandNotFound");
    });
});
