import { ethers } from "hardhat";
import { PlantyConfig } from "./interface";

export const localInfo: PlantyConfig = {
  plantyToken: {
    name: "PlantyToken",
    symbol: "PLANTY",
    plantManagerSupply: ethers.utils.parseEther("10000"),
    adminSupply: ethers.utils.parseEther("90000"),
  },
};
