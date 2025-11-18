class Connect4Logic {
  constructor() {
    this.ROWS = 6;
    this.COLS = 7;
  }

  // Initialize game state
  initializeGame(players) {
    return {
      board: Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null)),
      currentPlayer: 0,
      players: players.map((p, index) => ({
        userId: p.userId,
        username: p.username,
        color: index === 0 ? 'red' : 'yellow'
      })),
      winner: null,
      isDraw: false,
      gameOver: false,
      lastMove: null
    };
  }

  // Make a move
  makeMove(gameState, userId, column) {
    // Validate move
    if (gameState.gameOver) {
      throw new Error('Game is already over');
    }

    const currentPlayer = gameState.players[gameState.currentPlayer];
    if (currentPlayer.userId !== userId) {
      throw new Error('Not your turn');
    }

    if (column < 0 || column >= this.COLS) {
      throw new Error('Invalid column');
    }

    // Find the lowest empty row in the column
    let row = -1;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (gameState.board[r][column] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) {
      throw new Error('Column is full');
    }

    // Make the move
    gameState.board[row][column] = currentPlayer.color;
    gameState.lastMove = { row, column };

    // Check for winner
    if (this.checkWinner(gameState.board, row, column, currentPlayer.color)) {
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

  // Check for winner from last move
  checkWinner(board, row, col, color) {
    // Check horizontal
    if (this.checkDirection(board, row, col, 0, 1, color)) return true;
    // Check vertical
    if (this.checkDirection(board, row, col, 1, 0, color)) return true;
    // Check diagonal (down-right)
    if (this.checkDirection(board, row, col, 1, 1, color)) return true;
    // Check diagonal (down-left)
    if (this.checkDirection(board, row, col, 1, -1, color)) return true;

    return false;
  }

  // Check a specific direction for 4 in a row
  checkDirection(board, row, col, dRow, dCol, color) {
    let count = 1; // Count the current piece

    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + (dRow * i);
      const c = col + (dCol * i);
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
        count++;
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - (dRow * i);
      const c = col - (dCol * i);
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && board[r][c] === color) {
        count++;
      } else {
        break;
      }
    }

    return count >= 4;
  }

  // Check if board is full
  isBoardFull(board) {
    return board[0].every(cell => cell !== null);
  }

  // Calculate coins earned
  calculateCoins(gameState, userId) {
    if (gameState.winner === userId) {
      return 150; // Winner gets 150 coins
    } else if (gameState.isDraw) {
      return 30; // Draw gives 30 coins
    }
    return 0; // Loser gets nothing
  }
}

module.exports = new Connect4Logic();
