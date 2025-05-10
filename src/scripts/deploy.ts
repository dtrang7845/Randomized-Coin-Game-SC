// scripts/deploy.ts

import { ethers } from "hardhat";

async function main() {
  // Get the contract factory for your contract.
  const SimpleCoinGuessGame = await ethers.getContractFactory(
    "SimpleCoinGuessGame"
  );
  console.log("Deploying SimpleCoinGuessGame...");

  // Deploy the contract (you can pass any required constructor arguments here, if needed)
  const gameContract = await SimpleCoinGuessGame.deploy();

  await gameContract.deployed();

  console.log("SimpleCoinGuessGame deployed to:", gameContract.address);
}

// Execute the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
