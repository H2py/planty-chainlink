import { localInfo } from "@constants";
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

  await deploy("PlantyFactory", {
    from: admin.address,
    contract: "PlantyFactory",
    args: [],
    log: true,
    autoMine: true,
    gasLimit: 30000000,
  });

  await deploy("PlantyToken", {
    from: admin.address,
    contract: "PlantyToken",
    args: [
      localInfo.plantyToken.name,
      localInfo.plantyToken.symbol,
      admin.address,
      localInfo.plantyToken.plantManagerSupply,
      admin.address,
      localInfo.plantyToken.adminSupply,
    ],
    log: true,
    autoMine: true,
    gasLimit: 10000000,
  });

  await deploy("TestToken", {
    from: admin.address,
    contract: "TestToken",
    args: ["TEST", "TEST"],
    log: true,
    autoMine: true,
    gasLimit: 10000000,
  });
};

export default func;
func.tags = ["001_deploy_contracts"];
