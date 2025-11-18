class LudoLogic {
  constructor() {
    this.BOARD_SIZE = 52;
    this.TOKENS_PER_PLAYER = 4;
    this.COLORS = ['red', 'blue', 'green', 'yellow'];
  }

  // Initialize game state
  initializeGame(players) {
    const playerStates = players.map((p, index) => ({
      userId: p.userId,
      username: p.username,
      color: this.COLORS[index],
      tokens: Array(this.TOKENS_PER_PLAYER).fill(-1), // -1 means in home
      finished: 0
    }));

    return {
      players: playerStates,
      currentPlayer: 0,
      diceValue: null,
      winner: null,
      gameOver: false,
      turnStartTime: Date.now()
    };
  }

  // Roll dice
  rollDice(gameState, userId) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    if (gameState.diceValue !== null) {
      throw new Error('Dice already rolled, make your move');
    }

    gameState.diceValue = Math.floor(Math.random() * 6) + 1;
    return gameState;
  }

  // Move token
  moveToken(gameState, userId, tokenIndex) {
    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    if (gameState.diceValue === null) {
      throw new Error('Roll the dice first');
    }

    if (tokenIndex < 0 || tokenIndex >= this.TOKENS_PER_PLAYER) {
      throw new Error('Invalid token');
    }

    const currentPosition = currentPlayer.tokens[tokenIndex];

    // Check if token can leave home
    if (currentPosition === -1) {
      if (gameState.diceValue === 6) {
        currentPlayer.tokens[tokenIndex] = 0;
      } else {
        throw new Error('Need a 6 to start');
      }
    } else {
      // Move token
      const newPosition = currentPosition + gameState.diceValue;
      
      if (newPosition >= this.BOARD_SIZE) {
        // Token finished
        currentPlayer.tokens[tokenIndex] = this.BOARD_SIZE;
        currentPlayer.finished++;
        
        // Check if player won
        if (currentPlayer.finished === this.TOKENS_PER_PLAYER) {
          gameState.winner = userId;
          gameState.gameOver = true;
        }
      } else {
        currentPlayer.tokens[tokenIndex] = newPosition;
      }
    }

    // Next turn (unless rolled a 6)
    if (gameState.diceValue !== 6) {
      gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    }

    gameState.diceValue = null;
    gameState.turnStartTime = Date.now();

    return gameState;
  }

  // Calculate coins earned
  calculateCoins(gameState, userId) {
    const playerIndex = gameState.players.findIndex(p => p.userId === userId);
    if (playerIndex === -1) return 0;

    const player = gameState.players[playerIndex];
    
    if (gameState.winner === userId) {
      return 200; // Winner gets 200 coins
    }
    
    // Coins based on tokens finished
    return player.finished * 25;
  }
}

module.exports = new LudoLogic();
