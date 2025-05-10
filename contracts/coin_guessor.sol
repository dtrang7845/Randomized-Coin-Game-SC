// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleCoinGuessGame {
    address public owner;
    address public closestGuesser;
    uint256 public actualTokenValue;
    uint256 public closestGuessMargin;
    bool public isGameActive;

    event GameStarted(uint256 actualValue);
    event GuessMade(address indexed guesser, uint256 guessValue);
    event GameEnded(
        address indexed winner,
        uint256 winningGuess,
        uint256 margin
    );

    constructor() {
        owner = msg.sender;
        isGameActive = false;
        closestGuessMargin = type(uint256).max;
    }

    modifier gameActive() {
        require(isGameActive, "Game is not active");
        _;
    }

    // Simple mapping to store guesses
    mapping(address => uint256) public guesses;
    address[] public players;
    

    function startGame(uint256 _tokenValue) external {
        require(!isGameActive, "Game already in progress");
        // Reset game state
        actualTokenValue = _tokenValue;
        isGameActive = true;
        closestGuesser = address(0);
        closestGuessMargin = type(uint256).max;
        // Clear previous players' guesses
        for (uint256 i = 0; i < players.length; i++) {
            delete guesses[players[i]];
        }
        delete players;
        emit GameStarted(_tokenValue);
    }

    
    function submitGuess(uint256 guessedValue) external gameActive {
        uint256 margin;
        // Track new players
        if (guesses[msg.sender] == 0) {
            players.push(msg.sender);
        }

        // Calculate the margin (absolute difference)
        if (guessedValue > actualTokenValue) {
            margin = guessedValue - actualTokenValue;
        } else {
            margin = actualTokenValue - guessedValue;
        }
        // Update closest guess if better
        if (margin < closestGuessMargin) {
            closestGuessMargin = margin;
            closestGuesser = msg.sender;
            guesses[msg.sender] = guessedValue;
        }

        emit GuessMade(msg.sender, guessedValue);
    }

    function endGame() external gameActive {
        isGameActive = false;
        if (closestGuesser != address(0)) {
            emit GameEnded(
                closestGuesser,
                guesses[closestGuesser],
                closestGuessMargin
            );
        }
    }

    // View functions to get game state
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    function active() external view returns (bool) {
        return isGameActive;
    }


    function getWinner()
        external
        view
        returns (uint256 winningGuess, uint256 margin, uint256 tokenValue, address closestGuess)
    {
        return (guesses[closestGuesser], closestGuessMargin, actualTokenValue, closestGuesser);
    }
}
