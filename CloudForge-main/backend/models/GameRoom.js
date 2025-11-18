const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  isReady: {
    type: Boolean,
    default: false
  },
  isConnected: {
    type: Boolean,
    default: true
  },
  lastPing: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const gameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['tic-tac-toe', 'connect4', 'tambola', 'ludo']
  },
  gameMode: {
    type: String,
    required: true,
    enum: ['private', 'online']
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'playing', 'finished'],
    default: 'waiting'
  },
  players: [playerSchema],
  maxPlayers: {
    type: Number,
    required: true
  },
  minPlayers: {
    type: Number,
    required: true
  },
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  winner: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  finishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster room code lookups
gameRoomSchema.index({ roomCode: 1 });
gameRoomSchema.index({ status: 1, gameMode: 1 });

// Auto-delete finished rooms after 1 hour
gameRoomSchema.index({ finishedAt: 1 }, { 
  expireAfterSeconds: 3600,
  partialFilterExpression: { status: 'finished' }
});

// Method to add player to room
gameRoomSchema.methods.addPlayer = function(playerData) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Room is full');
  }
  
  this.players.push(playerData);
  return this.save();
};

// Method to remove player from room
gameRoomSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.userId !== userId);
  
  // If host leaves, assign new host
  if (this.players.length > 0 && !this.players.some(p => p.isHost)) {
    this.players[0].isHost = true;
  }
  
  return this.save();
};

// Method to update player ready status
gameRoomSchema.methods.updatePlayerReady = function(userId, isReady) {
  const player = this.players.find(p => p.userId === userId);
  if (player) {
    player.isReady = isReady;
  }
  return this.save();
};

// Method to check if game can start
gameRoomSchema.methods.canStartGame = function() {
  const readyPlayers = this.players.filter(p => p.isReady).length;
  return readyPlayers >= this.minPlayers && this.players.length >= this.minPlayers;
};

module.exports = mongoose.model('GameRoom', gameRoomSchema);
