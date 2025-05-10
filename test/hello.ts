import { expect } from "chai";
import { ethers } from 'hardhat';
import { Contract } from "ethers";


describe("hello contract", function () {
  let helloContract: Contract;

  beforeEach(async function () {
    const HelloFactory = await ethers.getContractFactory("Hello");
    helloContract = await HelloFactory.deploy("Initial Greeting");
  });

  it("should set and get the greeting", async function () {
    console.log("Test is running...");

    const tx = await helloContract.setGreeting("Hello, Hardhat!");
    await tx.wait();

    const greeting = await helloContract.greet();
    console.log(greeting)
    expect(greeting).to.equal("Hello, Hardhat!");
  });
});