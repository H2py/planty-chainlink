const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const PlantDataConsumer =
    await hre.ethers.getContractFactory("PlantDataConsumer");
  const contract = await PlantDataConsumer.deploy(
    "0xYourOracleAddress", // 오라클 주소
    "0xYourJobId", // Job ID (hex string으로 변환해야 함)
    ethers.utils.parseUnits("0.1", 18), // LINK 수수료
    "0xYourLinkTokenAddress", // LINK 토큰 주소
  );

  await contract.deployed();
  console.log("PlantDataConsumer deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
