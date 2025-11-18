const GameRoom = require('../models/GameRoom');
const User = require('../models/User');
const matchmakingService = require('../services/matchmakingService');
const ticTacToeLogic = require('../services/gameLogic/ticTacToeLogic');
const connect4Logic = require('../services/gameLogic/connect4Logic');
const tambolaLogic = require('../services/gameLogic/tambolaLogic');

const gameLogics = {
  'tic-tac-toe': ticTacToeLogic,
  'connect4': connect4Logic,
  'tambola': tambolaLogic
};

const gameConfigs = {
  'tic-tac-toe': { minPlayers: 2, maxPlayers: 2 },
  'connect4': { minPlayers: 2, maxPlayers: 2 },
  'tambola': { minPlayers: 2, maxPlayers: 8 }
};

class GameHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> socketId
    this.reconnectTimers = new Map(); // userId -> timeout
  }

  handleConnection(socket) {
    console.log('Client connected:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (data) => {
      try {
        const { userId, username } = data;
        socket.userId = userId;
        socket.username = username;
        
        // Store socket mapping
        this.userSockets.set(userId, socket.id);
        
        // Clear any reconnect timer
        if (this.reconnectTimers.has(userId)) {
          clearTimeout(this.reconnectTimers.get(userId));
          this.reconnectTimers.delete(userId);
        }

        socket.emit('authenticated', { success: true });
        console.log(`User authenticated: ${username} (${userId})`);
      } catch (error) {
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Create private room
    socket.on('createRoom', async (data) => {
      try {
        const { gameType } = data;
        const config = gameConfigs[gameType];

        const room = await matchmakingService.createPrivateRoom(
          gameType,
          {
            userId: socket.userId,
            username: socket.username,
            socketId: socket.id
          },
          config
        );

        socket.join(room.roomCode);
        socket.emit('roomCreated', {
          roomCode: room.roomCode,
          room: room.toObject()
        });

        console.log(`Room created: ${room.roomCode} for ${gameType}`);
      } catch (error) {
        console.error('Create room error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Join private room
    socket.on('joinRoom', async (data) => {
      try {
        const { roomCode } = data;

        const room = await matchmakingService.joinPrivateRoom(
          roomCode,
          {
            userId: socket.userId,
            username: socket.username,
            socketId: socket.id
          }
        );

        socket.join(room.roomCode);
        
        // Notify all players in room
        this.io.to(room.roomCode).emit('playerJoined', {
          player: {
            userId: socket.userId,
            username: socket.username
          },
          room: room.toObject()
        });

        socket.emit('roomJoined', { room: room.toObject() });

        console.log(`${socket.username} joined room: ${roomCode}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Toggle ready status
    socket.on('toggleReady', async (data) => {
      try {
        const { roomCode, isReady } = data;

        const room = await matchmakingService.updatePlayerReady(
          roomCode,
          socket.userId,
          isReady
        );

        this.io.to(roomCode).emit('playerReadyChanged', {
          userId: socket.userId,
          isReady,
          room: room.toObject()
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Start game
    socket.on('startGame', async (data) => {
      try {
        const { roomCode } = data;

        const room = await matchmakingService.startGame(roomCode);
        
        // Initialize game state
        const gameLogic = gameLogics[room.gameType];
        const gameState = gameLogic.initializeGame(room.players);
        
        room.gameState = gameState;
        await room.save();

        this.io.to(roomCode).emit('gameStarted', {
          gameState,
          room: room.toObject()
        });

        console.log(`Game started in room: ${roomCode}`);
      } catch (error) {
        console.error('Start game error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Join matchmaking queue
    socket.on('joinQueue', async (data) => {
      try {
        const { gameType } = data;

        const room = await matchmakingService.addToQueue(gameType, {
          userId: socket.userId,
          username: socket.username,
          socketId: socket.id
        });

        if (room) {
          // Match found!
          console.log('=== MATCH FOUND - JOINING PLAYERS TO ROOM ===');
          console.log('Room code:', room.roomCode);
          console.log('Players:', room.players);
          
          room.players.forEach(player => {
            const playerSocket = this.io.sockets.sockets.get(player.socketId);
            console.log(`Player ${player.username} (${player.userId}):`, {
              socketId: player.socketId,
              socketFound: !!playerSocket
            });
            if (playerSocket) {
              playerSocket.join(room.roomCode);
              console.log(`✅ Player ${player.username} joined room ${room.roomCode}`);
            } else {
              console.log(`❌ Socket not found for player ${player.username}`);
            }
          });

          // Initialize game state
          const gameLogic = gameLogics[room.gameType];
          const gameState = gameLogic.initializeGame(room.players);
          
          console.log('Initial game state:', JSON.stringify(gameState, null, 2));
          
          room.gameState = gameState;
          room.markModified('gameState'); // Mark as modified for Mongoose
          await room.save();
          console.log('Initial game state saved');

          console.log('Emitting matchFound to room:', room.roomCode);
          this.io.to(room.roomCode).emit('matchFound', {
            room: room.toObject(),
            gameState
          });

          console.log(`Match found for ${gameType}: ${room.roomCode}`);
        } else {
          socket.emit('queueJoined', { gameType });
        }
      } catch (error) {
        console.error('Join queue error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave queue
    socket.on('leaveQueue', (data) => {
      const { gameType } = data;
      matchmakingService.removeFromQueue(gameType, socket.userId);
      socket.emit('queueLeft', { gameType });
    });

    // Game move
    socket.on('gameMove', async (data) => {
      try {
        const { roomCode, moveData } = data;
        
        console.log('=== GAME MOVE RECEIVED ===');
        console.log('Socket ID:', socket.id);
        console.log('Socket userId:', socket.userId);
        console.log('Room code:', roomCode);
        console.log('Move data:', moveData);

        const room = await GameRoom.findOne({ roomCode });
        if (!room) {
          throw new Error('Room not found');
        }
        
        console.log('Room found:', room.roomCode);
        console.log('Game type:', room.gameType);
        console.log('Current game state:', JSON.stringify(room.gameState, null, 2));

        const gameLogic = gameLogics[room.gameType];
        let gameState = room.gameState;

        // Process move based on game type
        if (room.gameType === 'tic-tac-toe') {
          console.log('Processing tic-tac-toe move...');
          console.log('Current player index:', gameState.currentPlayer);
          console.log('Current player object:', gameState.players[gameState.currentPlayer]);
          console.log('Socket userId:', socket.userId);
          gameState = gameLogic.makeMove(gameState, socket.userId, moveData.position);
        } else if (room.gameType === 'connect4') {
          gameState = gameLogic.makeMove(gameState, socket.userId, moveData.column);
        } else if (room.gameType === 'tambola') {
          if (moveData.action === 'call') {
            gameState = gameLogic.callNumber(gameState);
          } else if (moveData.action === 'claim') {
            gameState = gameLogic.claimPrize(gameState, socket.userId, moveData.prizeType);
          }
        }

        room.gameState = gameState;
        room.markModified('gameState'); // CRITICAL: Tell Mongoose the Mixed field changed

        // Check if game is over
        if (gameState.gameOver) {
          room.status = 'finished';
          room.winner = gameState.winner;
          room.finishedAt = Date.now();

          // Update player stats and coins
          for (const player of room.players) {
            const user = await User.findOne({ uniqueId: player.userId });
            if (user) {
              const coinsEarned = gameLogic.calculateCoins(gameState, player.userId);
              const won = gameState.winner === player.userId;
              await user.updateGameStats(won, coinsEarned);
            }
          }
        }

        console.log('Saving room with updated game state...');
        await room.save();
        console.log('Room saved successfully!');

        console.log('Move processed successfully!');
        console.log('Broadcasting to room:', roomCode);
        console.log('Updated game state:', JSON.stringify(gameState, null, 2));
        
        // Broadcast game state to all players
        this.io.to(roomCode).emit('gameStateUpdated', {
          gameState,
          room: room.toObject()
        });
        
        console.log('gameStateUpdated event emitted to room:', roomCode);

        if (gameState.gameOver) {
          console.log('Game is over! Winner:', gameState.winner);
          this.io.to(roomCode).emit('gameOver', {
            winner: gameState.winner,
            gameState
          });
        }
      } catch (error) {
        console.error('Game move error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave room
    socket.on('leaveRoom', async (data) => {
      try {
        const { roomCode } = data;

        const room = await matchmakingService.leaveRoom(roomCode, socket.userId);
        
        socket.leave(roomCode);

        if (room) {
          this.io.to(roomCode).emit('playerLeft', {
            userId: socket.userId,
            username: socket.username,
            room: room.toObject()
          });
        }

        socket.emit('roomLeft', { roomCode });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (socket.userId) {
        // Set reconnect timer (30 seconds)
        const timer = setTimeout(async () => {
          // Remove user from all rooms after 30 seconds
          const rooms = await GameRoom.find({
            'players.userId': socket.userId,
            status: { $in: ['waiting', 'starting', 'playing'] }
          });

          for (const room of rooms) {
            await matchmakingService.leaveRoom(room.roomCode, socket.userId);
            this.io.to(room.roomCode).emit('playerDisconnected', {
              userId: socket.userId,
              username: socket.username
            });
          }

          this.userSockets.delete(socket.userId);
          this.reconnectTimers.delete(socket.userId);
        }, 30000);

        this.reconnectTimers.set(socket.userId, timer);

        // Notify rooms about temporary disconnect
        GameRoom.find({
          'players.userId': socket.userId,
          status: { $in: ['waiting', 'starting', 'playing'] }
        }).then(rooms => {
          rooms.forEach(room => {
            this.io.to(room.roomCode).emit('playerReconnecting', {
              userId: socket.userId,
              username: socket.username,
              timeout: 30
            });
          });
        });
      }
    });
  }
}

module.exports = GameHandler;
