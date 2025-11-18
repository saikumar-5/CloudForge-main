class TambolaLogic {
  constructor() {
    this.MAX_NUMBER = 90;
  }

  // Initialize game state
  initializeGame(players) {
    return {
      players: players.map(p => ({
        userId: p.userId,
        username: p.username,
        ticket: this.generateTicket(),
        markedNumbers: [],
        claims: {
          topLine: false,
          middleLine: false,
          bottomLine: false,
          fullHouse: false
        }
      })),
      calledNumbers: [],
      currentNumber: null,
      winner: null,
      gameOver: false,
      prizes: {
        topLine: null,
        middleLine: null,
        bottomLine: null,
        fullHouse: null
      }
    };
  }

  // Generate a tambola ticket (3 rows x 9 columns, 15 numbers total)
  generateTicket() {
    const ticket = Array(3).fill(null).map(() => Array(9).fill(null));
    const numbers = [];

    // Generate 15 unique random numbers
    while (numbers.length < 15) {
      const num = Math.floor(Math.random() * this.MAX_NUMBER) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }

    numbers.sort((a, b) => a - b);

    // Distribute numbers across the ticket
    let numIndex = 0;
    for (let row = 0; row < 3; row++) {
      const positions = this.getRandomPositions(5, 9);
      for (const pos of positions) {
        ticket[row][pos] = numbers[numIndex++];
      }
    }

    return ticket;
  }

  // Get random positions for numbers in a row
  getRandomPositions(count, max) {
    const positions = [];
    while (positions.length < count) {
      const pos = Math.floor(Math.random() * max);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    return positions.sort((a, b) => a - b);
  }

  // Call next number
  callNumber(gameState) {
    if (gameState.gameOver) {
      throw new Error('Game is over');
    }

    // Get uncalled numbers
    const uncalledNumbers = [];
    for (let i = 1; i <= this.MAX_NUMBER; i++) {
      if (!gameState.calledNumbers.includes(i)) {
        uncalledNumbers.push(i);
      }
    }

    if (uncalledNumbers.length === 0) {
      gameState.gameOver = true;
      throw new Error('All numbers called');
    }

    // Pick random number
    const randomIndex = Math.floor(Math.random() * uncalledNumbers.length);
    const number = uncalledNumbers[randomIndex];

    gameState.currentNumber = number;
    gameState.calledNumbers.push(number);

    // Auto-mark for all players
    gameState.players.forEach(player => {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
          if (player.ticket[row][col] === number) {
            player.markedNumbers.push(number);
          }
        }
      }
    });

    return gameState;
  }

  // Claim prize
  claimPrize(gameState, userId, prizeType) {
    const player = gameState.players.find(p => p.userId === userId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (gameState.prizes[prizeType]) {
      throw new Error('Prize already claimed');
    }

    // Verify claim
    let isValid = false;

    switch (prizeType) {
      case 'topLine':
        isValid = this.checkLine(player, 0);
        break;
      case 'middleLine':
        isValid = this.checkLine(player, 1);
        break;
      case 'bottomLine':
        isValid = this.checkLine(player, 2);
        break;
      case 'fullHouse':
        isValid = this.checkFullHouse(player);
        break;
    }

    if (!isValid) {
      throw new Error('Invalid claim');
    }

    gameState.prizes[prizeType] = userId;
    player.claims[prizeType] = true;

    // Check if game is over (full house claimed)
    if (prizeType === 'fullHouse') {
      gameState.winner = userId;
      gameState.gameOver = true;
    }

    return gameState;
  }

  // Check if a line is complete
  checkLine(player, rowIndex) {
    const row = player.ticket[rowIndex];
    return row.every(num => num === null || player.markedNumbers.includes(num));
  }

  // Check if full house is complete
  checkFullHouse(player) {
    for (let row = 0; row < 3; row++) {
      if (!this.checkLine(player, row)) {
        return false;
      }
    }
    return true;
  }

  // Calculate coins earned
  calculateCoins(gameState, userId) {
    const player = gameState.players.find(p => p.userId === userId);
    if (!player) return 0;

    let coins = 0;
    if (player.claims.topLine) coins += 50;
    if (player.claims.middleLine) coins += 50;
    if (player.claims.bottomLine) coins += 50;
    if (player.claims.fullHouse) coins += 150;

    return coins;
  }
}

module.exports = new TambolaLogic();
