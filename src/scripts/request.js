const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const consumerAddress = "0xYourConsumerContractAddress"; // 배포한 컨트랙트 주소
    const sourceCode = fs.readFileSync("./scripts/source.js", "utf8");

    const contract = await ethers.getContractAt(
        "FunctionsConsumer",
        consumerAddress
    );

    const subscriptionId = 1; // Chainlink 구독 ID
    const gasLimit = 500_000; // 가스 제한

    const tx = await contract.requestPlantData(sourceCode, subscriptionId, gasLimit);
    console.log("Request sent:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
