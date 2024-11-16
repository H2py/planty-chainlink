import { testnetInfo } from "@constants";
import { PlantyFactory, PlantyToken, TestToken } from "@typechains";
import { ethers, getNamedAccounts } from "hardhat";
import { CreatePoolInput } from "src/constants/interface";

const gasLimit = testnetInfo.network?.gasLimit ?? 10000000;

const createPool = async () => {
  const { developer } = await getNamedAccounts();
  const developerWallet = await ethers.getSigner(developer);
  console.log("💳 Script is running with wallet:", developerWallet.address);

  const plantyFactory = await ethers.getContract<PlantyFactory>("PlantyFactory");
  const assetToken = await ethers.getContract<PlantyToken>("PlantyToken");
  const usdcToken = await ethers.getContract<TestToken>("TestToken");

  const createPoolInput: CreatePoolInput = {
    assetToken: assetToken.address,
    usdcToken: usdcToken.address,
    ...testnetInfo.createPoolConfig!,
  };

  await Promise.all([
    (
      await assetToken.connect(developerWallet).approve(plantyFactory.address, createPoolInput.assetInitialSupply)
    ).wait(),
    (await usdcToken.connect(developerWallet).approve(plantyFactory.address, createPoolInput.usdcInitialSupply)).wait(),
  ]);
  console.log("🙂 Approve completed!");

  const receipt = await (await plantyFactory.connect(developerWallet).createPool(createPoolInput, { gasLimit })).wait();

  const event = receipt.events?.find((e) => e.event === "PoolCreated");
  if (!event || !event.args) throw new Error("Event #PoolCreated not found");
  console.log("🚀 Pool created at", event.args.poolAddress);
};

createPool();
