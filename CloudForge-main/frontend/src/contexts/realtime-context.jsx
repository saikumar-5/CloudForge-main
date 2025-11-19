import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth-context';

// Determine Socket.IO URL based on environment
const getSocketURL = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Use current window origin (same host and port)
  // This ensures the client connects to wherever the app is served from
  return window.location.origin;
};

const RealtimeContext = createContext({
  socket: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  toggleReady: () => {},
  startGame: () => {},
  joinQueue: () => {},
  leaveQueue: () => {},
  makeMove: () => {},
  currentRoom: null,
  gameState: null,
});

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [eventHandlers, setEventHandlers] = useState({});
  const handlersRef = useRef({});

  // Connect to Socket.IO server
  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = getSocketURL();
    console.log('🔗 Socket.IO connecting to:', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      
      console.log('=== AUTHENTICATING WITH SERVER ===');
      console.log('User object:', user);
      console.log('user.id:', user.id);
      console.log('user.uniqueId:', user.uniqueId);
      console.log('user.username:', user.username);
      
      // Use uniqueId if available, otherwise fall back to id
      const userId = user.uniqueId || user.id;
      console.log('Sending userId:', userId);
      
      // Authenticate with server
      newSocket.emit('authenticate', {
        userId: userId,
        username: user.username
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      const fn = handlersRef.current?.onError;
      if (fn) try { fn(error); } catch {}
    });

    // Room events
    newSocket.on('roomCreated', (data) => {
      console.log('Room created:', data);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onRoomCreated;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('roomJoined', (data) => {
      console.log('Room joined:', data);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onRoomJoined;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('playerJoined', (data) => {
      console.log('Player joined:', data);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onPlayerJoined;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('playerLeft', (data) => {
      console.log('Player left:', data);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onPlayerLeft;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('playerReadyChanged', (data) => {
      console.log('Player ready changed:', data);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onPlayerReadyChanged;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('gameStarted', (data) => {
      console.log('Game started:', data);
      setGameState(data.gameState);
      setCurrentRoom(data.room);
      const fn = handlersRef.current?.onGameStarted;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('matchFound', (data) => {
      console.log('Match found:', data);
      setCurrentRoom(data.room);
      setGameState(data.gameState);
      const fn = handlersRef.current?.onMatchFound;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('gameStateUpdated', (data) => {
      console.log('Game state updated:', data);
      setGameState(data.gameState);
      const fn = handlersRef.current?.onGameStateUpdated;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('gameOver', (data) => {
      console.log('Game over:', data);
      const fn = handlersRef.current?.onGameOver;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('playerReconnecting', (data) => {
      console.log('Player reconnecting:', data);
      const fn = handlersRef.current?.onPlayerReconnecting;
      if (fn) try { fn(data); } catch {}
    });

    newSocket.on('playerDisconnected', (data) => {
      console.log('Player disconnected:', data);
      const fn = handlersRef.current?.onPlayerDisconnected;
      if (fn) {
        try { fn(data); } catch {}
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Game actions
  const createRoom = useCallback((gameType) => {
    console.log('=== CREATE ROOM ===')
    console.log('Creating room for game type:', gameType)
    console.log('Socket connected:', socket?.connected)
    if (!socket) {
      console.error('Socket not available!')
      return;
    }
    socket.emit('createRoom', { gameType });
    console.log('createRoom event emitted')
  }, [socket]);

  const joinRoom = useCallback((roomCode) => {
    if (!socket) return;
    socket.emit('joinRoom', { roomCode });
  }, [socket]);

  const leaveRoom = useCallback((roomCode) => {
    if (!socket) return;
    socket.emit('leaveRoom', { roomCode });
    setCurrentRoom(null);
    setGameState(null);
  }, [socket]);

  const toggleReady = useCallback((roomCode, isReady) => {
    if (!socket) return;
    socket.emit('toggleReady', { roomCode, isReady });
  }, [socket]);

  const startGame = useCallback((roomCode) => {
    console.log('=== REALTIME START GAME ===')
    console.log('startGame called with roomCode:', roomCode)
    console.log('Socket connected:', socket?.connected)
    if (!socket) {
      console.error('Socket not available!')
      return;
    }
    console.log('Emitting startGame event to server...')
    socket.emit('startGame', { roomCode });
  }, [socket]);

  const joinQueue = useCallback((gameType) => {
    if (!socket) return;
    socket.emit('joinQueue', { gameType });
  }, [socket]);

  const leaveQueue = useCallback((gameType) => {
    if (!socket) return;
    socket.emit('leaveQueue', { gameType });
  }, [socket]);

  const makeMove = useCallback((roomCode, moveData) => {
    console.log('=== MAKE MOVE ===')
    console.log('Room code:', roomCode)
    console.log('Move data:', moveData)
    console.log('Socket connected:', socket?.connected)
    console.log('Socket ID:', socket?.id)
    if (!socket) {
      console.error('Socket not available!')
      return;
    }
    console.log('Emitting gameMove event...')
    socket.emit('gameMove', { roomCode, moveData });
  }, [socket]);

  const registerEventHandler = useCallback((event, handler) => {
    setEventHandlers(prev => ({ ...prev, [event]: handler }));
    handlersRef.current = { ...handlersRef.current, [event]: handler };
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setCurrentRoom(null);
      setGameState(null);
    }
  }, [socket]);

  return (
    <RealtimeContext.Provider value={{ 
      socket,
      isConnected, 
      connect: () => {}, // Auto-connects on user login
      disconnect,
      createRoom,
      joinRoom,
      leaveRoom,
      toggleReady,
      startGame,
      joinQueue,
      leaveQueue,
      makeMove,
      registerEventHandler,
      currentRoom,
      gameState
    }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export default RealtimeProvider;
