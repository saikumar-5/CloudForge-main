const GameRoom = require('../models/GameRoom');
const { v4: uuidv4 } = require('uuid');

class MatchmakingService {
  constructor() {
    this.matchmakingQueue = new Map(); // gameType -> array of waiting players
  }

  // Generate unique room code
  generateRoomCode() {
    // Generate a more predictable 6-character code using Math.random
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a private room
  async createPrivateRoom(gameType, hostData, gameConfig) {
    try {
      const roomCode = this.generateRoomCode();
      
      const room = new GameRoom({
        roomCode,
        gameType,
        gameMode: 'private',
        status: 'waiting',
        maxPlayers: gameConfig.maxPlayers,
        minPlayers: gameConfig.minPlayers,
        players: [{
          userId: hostData.userId,
          username: hostData.username,
          socketId: hostData.socketId,
          isHost: true,
          isReady: true
        }]
      });

      await room.save();
      return room;
    } catch (error) {
      console.error('Error creating private room:', error);
      throw error;
    }
  }

  // Join a private room
  async joinPrivateRoom(roomCode, playerData) {
    try {
      const room = await GameRoom.findOne({ 
        roomCode: roomCode.toUpperCase(),
        status: { $in: ['waiting', 'starting'] }
      });

      if (!room) {
        throw new Error('Room not found or already started');
      }

      if (room.players.length >= room.maxPlayers) {
        throw new Error('Room is full');
      }

      // Check if player already in room
      const existingPlayer = room.players.find(p => p.userId === playerData.userId);
      if (existingPlayer) {
        throw new Error('You are already in this room');
      }

      await room.addPlayer({
        userId: playerData.userId,
        username: playerData.username,
        socketId: playerData.socketId,
        isHost: false,
        isReady: false
      });

      return room;
    } catch (error) {
      console.error('Error joining private room:', error);
      throw error;
    }
  }

  // Add player to matchmaking queue
  async addToQueue(gameType, playerData) {
    if (!this.matchmakingQueue.has(gameType)) {
      this.matchmakingQueue.set(gameType, []);
    }

    const queue = this.matchmakingQueue.get(gameType);
    
    // Check if player already in queue
    const existingIndex = queue.findIndex(p => p.userId === playerData.userId);
    if (existingIndex !== -1) {
      queue.splice(existingIndex, 1);
    }

    queue.push({
      ...playerData,
      queuedAt: Date.now()
    });

    // Try to match players
    return await this.tryMatch(gameType);
  }

  // Try to match players from queue
  async tryMatch(gameType) {
    const queue = this.matchmakingQueue.get(gameType);
    if (!queue || queue.length < 2) {
      return null;
    }

    // Get game configuration
    const gameConfigs = {
      'tic-tac-toe': { minPlayers: 2, maxPlayers: 2 },
      'connect4': { minPlayers: 2, maxPlayers: 2 },
      'tambola': { minPlayers: 2, maxPlayers: 8 }
    };

    const config = gameConfigs[gameType];
    if (!config) return null;

    // Match minimum required players
    const matchedPlayers = queue.splice(0, config.minPlayers);
    
    try {
      const roomCode = this.generateRoomCode();
      
      const room = new GameRoom({
        roomCode,
        gameType,
        gameMode: 'online',
        status: 'starting',
        maxPlayers: config.maxPlayers,
        minPlayers: config.minPlayers,
        players: matchedPlayers.map((player, index) => ({
          userId: player.userId,
          username: player.username,
          socketId: player.socketId,
          isHost: index === 0,
          isReady: true
        }))
      });

      await room.save();
      return room;
    } catch (error) {
      // Put players back in queue if room creation fails
      queue.unshift(...matchedPlayers);
      throw error;
    }
  }

  // Remove player from queue
  removeFromQueue(gameType, userId) {
    if (!this.matchmakingQueue.has(gameType)) {
      return;
    }

    const queue = this.matchmakingQueue.get(gameType);
    const index = queue.findIndex(p => p.userId === userId);
    
    if (index !== -1) {
      queue.splice(index, 1);
    }
  }

  // Get room by code
  async getRoomByCode(roomCode) {
    return await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
  }

  // Update player ready status
  async updatePlayerReady(roomCode, userId, isReady) {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      throw new Error('Room not found');
    }

    await room.updatePlayerReady(userId, isReady);
    return room;
  }

  // Start game
  async startGame(roomCode) {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      throw new Error('Room not found');
    }

    if (!room.canStartGame()) {
      throw new Error('Not enough ready players to start');
    }

    room.status = 'playing';
    room.startedAt = Date.now();
    await room.save();

    return room;
  }

  // Leave room
  async leaveRoom(roomCode, userId) {
    const room = await GameRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) {
      return null;
    }

    await room.removePlayer(userId);

    // Delete room if empty
    if (room.players.length === 0) {
      await GameRoom.deleteOne({ _id: room._id });
      return null;
    }

    return room;
  }
}

module.exports = new MatchmakingService();
