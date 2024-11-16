import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { setup } from "./setup";
import { PlantyFactory, PlantyPool, PlantyToken, TestToken } from "@typechains";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { CreatePoolInput, mockCreatePoolInput } from "./mock/mock";
import { faker } from "@faker-js/faker";
import { HardhatUtil } from "./lib/hardhat-util";

describe("PlantyFactory 테스트", () => {
  /* Signer */
  let admin: SignerWithAddress;
  let plantManager: SignerWithAddress;
  let users: SignerWithAddress[];

  /* Contracts */
  let plantyFactory: PlantyFactory;
  let plantyPool: PlantyPool;
  let plantyToken: PlantyToken;
  let usdc: TestToken;

  /* Snapshots */
  let initialSnapshotId: number;
  let snapshotId: number;

  /* Initial Data */
  let createPoolInput: CreatePoolInput;

  before(async () => {
    ({ admin, plantManager, users, plantyFactory, plantyToken, testToken: usdc } = await setup());
    initialSnapshotId = await network.provider.send("evm_snapshot");
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send("evm_snapshot");

    /* 풀 생성 */
    createPoolInput = mockCreatePoolInput({ assetToken: plantyToken.address, usdcToken: usdc.address });
    await usdc.connect(admin).mint(admin.address, createPoolInput.usdcInitialSupply);

    await plantyToken.connect(admin).approve(plantyFactory.address, createPoolInput.assetInitialSupply);
    await usdc.connect(admin).approve(plantyFactory.address, createPoolInput.usdcInitialSupply);

    await plantyFactory.connect(admin).createPool(createPoolInput);
    const plantyPoolAddress = await plantyFactory.pools(0);

    plantyPool = await ethers.getContractAt("PlantyPool", plantyPoolAddress);
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [snapshotId]);
  });

  after(async () => {
    await network.provider.send("evm_revert", [initialSnapshotId]);
  });

  describe("Public Sale 테스트", () => {
    it("BuyAsset, SellAsset이 불가능한가?", async () => {
      const amount = ethers.utils.parseEther(faker.datatype.number().toString());
      await expect(plantyPool.connect(users[0]).buyAsset(amount)).to.be.reverted;
      await expect(plantyPool.connect(users[0]).sellAsset(amount)).to.be.reverted;
    });

    it("buyAssetDuringPublicSale을 통해 publicSalePrice로 구매가 가능한가?", async () => {
      const publicSalePrice = await plantyPool.publicSalePrice();
      const buyAmount = ethers.utils.parseEther(faker.datatype.number({ min: 1, max: 10 }).toString());
      const totalCost = publicSalePrice.mul(buyAmount);

      await usdc.connect(users[0]).mint(users[0].address, totalCost);
      await usdc.connect(users[0]).approve(plantyPool.address, totalCost);

      await expect(plantyPool.connect(users[0]).buyAssetDuringPublicSale(buyAmount)).to.not.be.reverted;

      const userAssetBalance = await plantyToken.balanceOf(users[0].address);
      expect(userAssetBalance).to.equal(buyAmount);
    });

    it("sellAssetDuringPublicSale을 통해 publicSalePrice로 판매가 가능한가?", async () => {
      /* Buy First */
      const publicSalePrice = await plantyPool.publicSalePrice();
      const buyAmount = ethers.utils.parseEther(faker.datatype.number({ min: 1, max: 10 }).toString());
      const totalCost = publicSalePrice.mul(buyAmount);

      await usdc.connect(users[0]).mint(users[0].address, totalCost);
      await usdc.connect(users[0]).approve(plantyPool.address, totalCost);

      await expect(plantyPool.connect(users[0]).buyAssetDuringPublicSale(buyAmount)).to.not.be.reverted;

      /* Sell */
      await plantyToken.connect(users[0]).approve(plantyPool.address, buyAmount);

      await expect(plantyPool.connect(users[0]).sellAssetDuringPublicSale(buyAmount)).to.not.be.reverted;

      const userPlantyBalance = await plantyToken.balanceOf(users[0].address);
      expect(userPlantyBalance).to.equal(0);

      const userUSDCBalance = await usdc.balanceOf(users[0].address);
      expect(userUSDCBalance).to.equal(totalCost);
    });
  });

  describe("Bonding Curve 테스트", () => {
    beforeEach(async () => {
      /* Public sale 종료 기간으로 블록 이동 */
      const publicSaleEndTime = await plantyPool.publicSaleEndTime();
      await HardhatUtil.setNextBlockTimestamp(Number(publicSaleEndTime));
    });

    it("Public Sale이 불가능한가?", async () => {
      await expect(plantyPool.connect(users[0]).buyAssetDuringPublicSale(1)).to.be.reverted;
      await expect(plantyPool.connect(users[0]).sellAssetDuringPublicSale(1)).to.be.reverted;
    });

    it("buyAsset을 통한 자산 구매가 가능한가?", async () => {
      const buyAmount = ethers.utils.parseEther(faker.datatype.number({ min: 1, max: 10 }).toString());
      const { inputValue: totalCost } = await plantyPool.getBuyInfo(buyAmount);

      await usdc.connect(users[0]).mint(users[0].address, totalCost);
      await usdc.connect(users[0]).approve(plantyPool.address, totalCost);
      await plantyPool.connect(users[0]).buyAsset(buyAmount);

      const userAssetBalance = await plantyToken.balanceOf(users[0].address);
      expect(userAssetBalance).to.equal(buyAmount);
    });

    it("sellAsset을 통한 자산 판매가 가능한가?", async () => {
      /* Buy First */
      const buyAmount = ethers.utils.parseEther(faker.datatype.number({ min: 1, max: 10 }).toString());
      const { inputValue: totalBuyCost } = await plantyPool.getBuyInfo(buyAmount);

      await usdc.connect(users[0]).mint(users[0].address, totalBuyCost);
      await usdc.connect(users[0]).approve(plantyPool.address, totalBuyCost);
      await plantyPool.connect(users[0]).buyAsset(buyAmount);

      /* Sell */
      await plantyToken.connect(users[0]).approve(plantyPool.address, buyAmount);
      await plantyPool.connect(users[0]).sellAsset(buyAmount);

      const userAssetBalance = await plantyToken.balanceOf(users[0].address);
      expect(userAssetBalance).to.equal(0);
    });
  });
});
