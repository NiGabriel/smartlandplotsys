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
        await expect(escrow.registerUser("Seller One", seller.address, 0))
            .to.emit(escrow, "UserRegistered")
            .withArgs(1, seller.address);

        const user = await escrow.getUser(1);
        expect(user.id).to.equal(1);
        expect(user.fullName).to.equal("Seller One");
        expect(user.wallet).to.equal(seller.address);
        expect(user.role).to.equal(0);
        expect(user.exists).to.equal(true);
    });

    it("should revert when non-registrar tries to register a user", async function () {
        await expect(
            escrow.connect(seller).registerUser("Attacker", seller.address, 0)
        ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should register land for an existing user and emit LandRegistered", async function () {
        await escrow.registerUser("Seller One", seller.address, 0);

        await expect(
            escrow.registerLand("Green Plot", "Sector 7", 150, 1)
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

    it("should revert when non-registrar tries to register land", async function () {
        await expect(
            escrow.connect(seller).registerLand("Bad Plot", "Nowhere", 100, 1)
        ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("should revert when registrar registers land with invalid ownerId", async function () {
        await expect(
            escrow.registerLand("Bad Plot", "Nowhere", 100, 999)
        ).to.be.revertedWithCustomError(escrow, "UserNotFound");
    });

    it("should emit LandListed when seller lists a land", async function () {
        await escrow.registerUser("Seller One", seller.address, 0);
        await escrow.registerLand("Clearing", "Sector 2", 80, 1);

        await expect(
            escrow.connect(seller).listLand(1, ethers.parseEther("0.5"))
        ).to.emit(escrow, "LandListed").withArgs(1, ethers.parseEther("0.5"));
    });

    it("should revert when trying to get a non-existent user", async function () {
        await expect(escrow.getUser(999)).to.be.revertedWithCustomError(escrow, "UserNotFound");
    });

    it("should revert when trying to get a non-existent land record", async function () {
        await expect(escrow.getLand(999)).to.be.revertedWithCustomError(escrow, "LandNotFound");
    });
});

describe("Full escrow flow", function () {
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

        // register seller and buyer by registrar
        await escrow.registerUser("Seller One", seller.address, 0);
        await escrow.registerUser("Buyer One", buyer.address, 1);

        // registrar registers a land on behalf of seller, then seller lists it
        await escrow.registerLand("River Plot", "Sector 9", 100, 1);
        await escrow.connect(seller).listLand(1, ethers.parseEther("1.0"));
    });

    it("should emit PurchaseInitiated when buyer starts purchase", async function () {
        const tx = await escrow.connect(buyer).initiatePurchase(1);
        const receipt = await tx.wait();
        const iface = escrow.interface;
        const log = receipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        });
        expect(log).to.not.equal(undefined);
        const parsed = iface.parseLog(log);
        expect(parsed.args[1]).to.equal(1);
        expect(parsed.args[2]).to.equal(2);
    });

    it("should emit PaymentFunded when buyer pays escrow", async function () {
        const txInit = await escrow.connect(buyer).initiatePurchase(1);
        const initReceipt = await txInit.wait();
        const iface = escrow.interface;
        const initLog = initReceipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        });
        const txId = iface.parseLog(initLog).args[0];

        await expect(
            escrow.connect(buyer).payForTransaction(txId, { value: ethers.parseEther("1.0") })
        ).to.emit(escrow, "PaymentFunded").withArgs(txId, ethers.parseEther("1.0"));
    });

    it("should emit SaleApproved and TransferCompleted when registrar finalizes", async function () {
        const txInit = await escrow.connect(buyer).initiatePurchase(1);
        const initReceipt = await txInit.wait();
        const iface = escrow.interface;
        const txId = iface.parseLog(initReceipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        })).args[0];

        await escrow.connect(buyer).payForTransaction(txId, { value: ethers.parseEther("1.0") });
        await expect(escrow.connect(owner).approveSale(txId)).to.emit(escrow, "SaleApproved").withArgs(txId);

        await expect(escrow.connect(owner).finalizeTransaction(txId))
            .to.emit(escrow, "TransferCompleted")
            .withArgs(txId, 1, 1, 2);
    });

    it("should emit TransactionReversed when registrar cancels a funded transaction", async function () {
        const txInit = await escrow.connect(buyer).initiatePurchase(1);
        const initReceipt = await txInit.wait();
        const iface = escrow.interface;
        const txId = iface.parseLog(initReceipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        })).args[0];

        await escrow.connect(buyer).payForTransaction(txId, { value: ethers.parseEther("1.0") });
        await expect(escrow.connect(owner).reverseTransaction(txId))
            .to.emit(escrow, "TransactionReversed")
            .withArgs(txId);
    });

    it("complete purchase flow moves funds and transfers ownership", async function () {
        const txInit = await escrow.connect(buyer).initiatePurchase(1);
        const initReceipt = await txInit.wait();
        const iface = escrow.interface;
        const txId = iface.parseLog(initReceipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        })).args[0];

        const price = ethers.parseEther("1.0");
        await escrow.connect(buyer).payForTransaction(txId, { value: price });

        const contractAddr = await escrow.getAddress();
        const contractBalance = await ethers.provider.getBalance(contractAddr);
        expect(contractBalance).to.equal(price);

        await escrow.connect(owner).approveSale(txId);

        const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
        await escrow.connect(owner).finalizeTransaction(txId);
        const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

        expect(sellerBalanceAfter).to.be.above(sellerBalanceBefore);

        const land = await escrow.getLand(1);
        expect(land.ownerId).to.equal(2);
    });

    it("registrar can reverse a funded transaction and refund buyer", async function () {
        const txInit = await escrow.connect(buyer).initiatePurchase(1);
        const initReceipt = await txInit.wait();
        const iface = escrow.interface;
        const txId = iface.parseLog(initReceipt.logs.find((l) => {
            try { return iface.parseLog(l).name === "PurchaseInitiated"; } catch { return false; }
        })).args[0];

        await escrow.connect(buyer).payForTransaction(txId, { value: ethers.parseEther("1.0") });

        await escrow.connect(owner).reverseTransaction(txId);

        const contractAddr = await escrow.getAddress();
        const contractBalance = await ethers.provider.getBalance(contractAddr);
        expect(contractBalance).to.equal(0);
    });
});
