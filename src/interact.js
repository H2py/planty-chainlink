async function main() {
  const contractAddress = "YOUR_CONTRACT_ADDRESS";
  const PlantDataConsumer =
    await ethers.getContractFactory("PlantDataConsumer");
  const plantDataConsumer = await PlantDataConsumer.attach(contractAddress);

  const tx = await plantDataConsumer.fetchPlantData();
  await tx.wait();

  const humidity = await plantDataConsumer.humidity();
  console.log("Humidity:", humidity.toString());

  const temperature = await plantDataConsumer.temperature();
  console.log("Temperature:", temperature.toString());

  const plantType = await plantDataConsumer.plantType();
  console.log("Plant Type:", plantType);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
