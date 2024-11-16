import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { setup } from "./setup";
import { PlantyFactory, PlantyToken, TestToken } from "@typechains";
import { expect } from "chai";
import { network } from "hardhat";
import { mockCreatePoolInput } from "./mock/mock";

describe("PlantyFactory 테스트", () => {
  /* Signer */
  let admin: SignerWithAddress;

  /* Contracts */
  let plantyFactory: PlantyFactory;
  let plantyToken: PlantyToken;
  let usdc: TestToken;

  /* Snapshots */
  let initialSnapshotId: number;
  let snapshotId: number;

  before(async () => {
    ({ admin, plantyFactory, plantyToken, testToken: usdc } = await setup());
    initialSnapshotId = await network.provider.send("evm_snapshot");
  });

  beforeEach(async () => {
    snapshotId = await network.provider.send("evm_snapshot");
  });

  afterEach(async () => {
    await network.provider.send("evm_revert", [snapshotId]);
  });

  after(async () => {
    await network.provider.send("evm_revert", [initialSnapshotId]);
  });

  describe("#CreatePool", () => {
    it("풀이 정상적으로 생성되는가?", async () => {
      const createPoolInput = mockCreatePoolInput({ assetToken: plantyToken.address, usdcToken: usdc.address });
      await usdc.connect(admin).mint(admin.address, createPoolInput.usdcInitialSupply);

      await plantyToken.connect(admin).approve(plantyFactory.address, createPoolInput.assetInitialSupply);
      await usdc.connect(admin).approve(plantyFactory.address, createPoolInput.usdcInitialSupply);

      await plantyFactory.connect(admin).createPool(createPoolInput);

      const poolAddress = await plantyFactory.pools(0);
      const poolInfo = await plantyFactory.getPoolInfo(poolAddress);

      const { spotPrice, delta, protocolFeeMultiplier, tradeFeeMultiplier, reserveAsset, reserveUSDC } = poolInfo;

      expect(spotPrice).to.equal(createPoolInput.initialSpotPrice);
      expect(delta).to.equal(createPoolInput.delta);
      expect(protocolFeeMultiplier).to.equal(createPoolInput.protocolFeeMultiplier);
      expect(tradeFeeMultiplier).to.equal(createPoolInput.tradeFeeMultiplier);
      expect(reserveAsset).to.equal(createPoolInput.assetInitialSupply);
      expect(reserveUSDC).to.equal(createPoolInput.usdcInitialSupply);
    });
  });
});
