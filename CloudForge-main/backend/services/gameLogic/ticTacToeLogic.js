class TicTacToeLogic {
  constructor() {
    this.BOARD_SIZE = 3;
  }

  // Initialize game state
  initializeGame(players) {
    return {
      board: Array(9).fill(null),
      currentPlayer: 0,
      players: players.map((p, index) => ({
        userId: p.userId,
        username: p.username,
        symbol: index === 0 ? 'X' : 'O'
      })),
      winner: null,
      isDraw: false,
      gameOver: false
    };
  }

  // Make a move
  makeMove(gameState, userId, position) {
    // Validate move
    if (gameState.gameOver) {
      throw new Error('Game is already over');
    }

    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    if (position < 0 || position >= 9) {
      throw new Error('Invalid position');
    }

    if (gameState.board[position] !== null) {
      throw new Error('Position already taken');
    }

    // Make the move
    gameState.board[position] = currentPlayer.symbol;

    // Check for winner
    const winner = this.checkWinner(gameState.board);
    if (winner) {
      gameState.winner = currentPlayer.userId;
      gameState.gameOver = true;
    } else if (this.isBoardFull(gameState.board)) {
      gameState.isDraw = true;
      gameState.gameOver = true;
    } else {
      // Switch to next player
      gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
    }

    return gameState;
  }

  // Check for winner
  checkWinner(board) {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  // Check if board is full
  isBoardFull(board) {
    return board.every(cell => cell !== null);
  }

  // Calculate coins earned
  calculateCoins(gameState, userId) {
    if (gameState.winner === userId) {
      return 100; // Winner gets 100 coins
    } else if (gameState.isDraw) {
      return 25; // Draw gives 25 coins
    }
    return 0; // Loser gets nothing
  }
}

module.exports = new TicTacToeLogic();
