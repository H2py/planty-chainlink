import { ethers } from "hardhat";
import { PlantyConfig } from "./interface";
import { BigNumber } from "ethers";

export const testnetInfo: PlantyConfig = {
  plantyToken: {
    name: "PlantyToken",
    symbol: "PLANTY",
    plantManagerSupply: ethers.utils.parseEther("200000"),
    adminSupply: ethers.utils.parseEther("1000000"),
  },
  createPoolConfig: {
    assetInitialSupply: ethers.utils.parseEther("1000000"),
    usdcInitialSupply: ethers.utils.parseEther("100000"),
    initialSpotPrice: ethers.utils.parseEther("10"),
    delta: ethers.utils.parseEther("0.01"),
    protocolFeeMultiplier: ethers.utils.parseEther("0.01"),
    tradeFeeMultiplier: ethers.utils.parseEther("0.01"),
    publicSaleDuration: BigNumber.from(10000000000), // almost infinite
    publicSalePrice: ethers.utils.parseEther("10"),
  },
  network: {
    gasLimit: 10000000,
  },
};
