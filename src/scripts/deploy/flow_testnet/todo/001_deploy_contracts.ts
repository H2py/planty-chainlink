import { testnetInfo } from "@constants";
import { TestToken } from "@typechains";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * @dev this script is used for tests and deployments on hardhat network
 * @deployer person who deployed
 * @date deployed date
 * @description summary of this deployment
 */

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments } = hre;
  const { deploy } = deployments;
  const [admin] = await ethers.getSigners();

  const plantyFactory = await deploy("PlantyFactory", {
    from: admin.address,
    contract: "PlantyFactory",
    args: [],
    log: true,
    autoMine: true,
    gasLimit: 30000000,
  });
  console.log("🚀 PlantyFactory deployed at", plantyFactory.address);

  const plantyToken = await deploy("PlantyToken", {
    from: admin.address,
    contract: "PlantyToken",
    args: [
      testnetInfo.plantyToken.name,
      testnetInfo.plantyToken.symbol,
      admin.address,
      testnetInfo.plantyToken.plantManagerSupply,
      admin.address,
      testnetInfo.plantyToken.adminSupply,
    ],
    log: true,
    autoMine: true,
    gasLimit: 10000000,
  });
  console.log("🚀 PlantyToken deployed at", plantyToken.address);

  const testToken = await deploy("TestToken", {
    from: admin.address,
    contract: "TestToken",
    args: ["TEST USDC", "USDC"],
    log: true,
    autoMine: true,
    gasLimit: 10000000,
  });
  console.log("🚀 TestToken deployed at", testToken.address);

  const testTokenContract = await ethers.getContract<TestToken>("TestToken");
  await testTokenContract.connect(admin).mint(admin.address, ethers.utils.parseEther("1000000000000"));
};

export default func;
func.tags = ["001_deploy_contracts"];
