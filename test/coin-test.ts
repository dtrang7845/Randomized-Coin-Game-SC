import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleCoinGuessGame", function () {
  let coinGame: Contract;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;

  beforeEach(async function () {
    // Get signers
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy contract
    const GameFactory = await ethers.getContractFactory("SimpleCoinGuessGame");
    coinGame = await GameFactory.deploy();
    await coinGame.waitForDeployment();
  });

  describe("Game functionality", function () {
    it("Should start a game with the specified token value", async function () {
      const tokenValue = 1000;
      
      // Listen for the event before sending the transaction
      const eventPromise = new Promise((resolve) => {
        coinGame.once("GameStarted", (value) => {
          resolve(value);
        });
      });
      
      const tx = await coinGame.startGame(tokenValue);
      await tx.wait();
      
      expect(await coinGame.isGameActive()).to.equal(true);
      expect(await coinGame.actualTokenValue()).to.equal(tokenValue);
      
      // Wait for the event
      const emittedValue = await eventPromise;
      expect(emittedValue).to.equal(tokenValue);
    });

    it("Should record guesses and track the closest guesser", async function () {
      // Start game with value 1000
      await coinGame.startGame(1000);
      
      // Player 1 guesses 900 (off by 100)
      await coinGame.connect(player1).submitGuess(900);
      expect(await coinGame.closestGuesser()).to.equal(player1.address);
      expect(await coinGame.closestGuessMargin()).to.equal(100);
      
      // Player 2 guesses 950 (off by 50)
      await coinGame.connect(player2).submitGuess(950);
      expect(await coinGame.closestGuesser()).to.equal(player2.address);
      expect(await coinGame.closestGuessMargin()).to.equal(50);
      
      // Player 3 guesses 1100 (off by 100)
      await coinGame.connect(player3).submitGuess(1100);
      expect(await coinGame.closestGuesser()).to.equal(player2.address); // Player 2 still closest
      expect(await coinGame.closestGuessMargin()).to.equal(50);
    });

    it("Should end game and emit winner details", async function () {
      // Start game
      await coinGame.startGame(1000);
      
      // Submit guesses
      await coinGame.connect(player1).submitGuess(950);
      await coinGame.connect(player2).submitGuess(980);
      
      // Listen for the event before ending the game
      const eventPromise = new Promise((resolve) => {
        coinGame.once("GameEnded", (winner, winningGuess, margin) => {
          resolve({ winner, winningGuess, margin });
        });
      });
      
      // End game
      const tx = await coinGame.endGame();
      await tx.wait();
      
      // Check game state
      expect(await coinGame.isGameActive()).to.equal(false);
      
      // Check winner event
      const eventData = await eventPromise;
      expect(eventData.winner).to.equal(player2.address); // Winner
      expect(eventData.winningGuess).to.equal(980); // Winning guess
      expect(eventData.margin).to.equal(20); // Margin
      console.log(eventData.winner);
    });

    it("Should reset game state between games", async function () {
      // First game
      await coinGame.startGame(1000);
      await coinGame.connect(player1).submitGuess(950);
      await coinGame.connect(player2).submitGuess(980);
      await coinGame.endGame();
      
      // Second game
      await coinGame.startGame(2000);
      
      // Check that state was reset
      expect(await coinGame.getPlayerCount()).to.equal(0);
      expect(await coinGame.closestGuessMargin()).to.equal(ethers.MaxUint256);
      expect(await coinGame.closestGuesser()).to.equal(ethers.ZeroAddress);
      expect(await coinGame.actualTokenValue()).to.equal(2000);
    });

    it("Should return winner details correctly", async function () {
      // Start game
      await coinGame.startGame(1000);
      
      // Submit guesses
      await coinGame.connect(player1).submitGuess(920);
      await coinGame.connect(player2).submitGuess(980);
      
      // Check winner details
      const winnerInfo = await coinGame.getWinner();
      expect(winnerInfo[0]).to.equal(player2.address); // winner
      expect(winnerInfo[1]).to.equal(980); // winningGuess
      expect(winnerInfo[2]).to.equal(20); // margin
    });
  });
});