import { PlantyFactory, PlantyToken, TestToken } from "@typechains";
import { deployments, ethers } from "hardhat";

export const setup = async () => {
  const [admin, plantManager, ...users] = await ethers.getSigners();

  await deployments.fixture(["PlantyFactory", "PlantyToken", "TestToken"]);
  const contracts = {
    plantyFactory: await ethers.getContract<PlantyFactory>("PlantyFactory"),
    plantyToken: await ethers.getContract<PlantyToken>("PlantyToken"),
    testToken: await ethers.getContract<TestToken>("TestToken"),
  };

  return {
    admin,
    plantManager,
    users,
    ...contracts,
  };
};
