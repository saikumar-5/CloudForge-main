"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/auth-context"
import { useRealtime } from "../../contexts/realtime-context"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Progress } from "../ui/progress"
import { Users, Globe, Search, X, Hash } from "lucide-react"
import { toast } from "../../hooks/use-toast"

const GameModal = ({ isOpen, game, onClose, onStartGame }) => {
  // Support both prop names for compatibility
  const onGameStart = onStartGame
  const { user } = useAuth()
  const { 
    createRoom: rtCreateRoom,
    joinRoom: rtJoinRoom,
    leaveRoom: rtLeaveRoom,
    toggleReady: rtToggleReady,
    startGame: rtStartGame,
    joinQueue: rtJoinQueue,
    leaveQueue: rtLeaveQueue,
    registerEventHandler,
    currentRoom,
    gameState
  } = useRealtime()
  const [mode, setMode] = useState("select")
  const [roomCode, setRoomCode] = useState("")
  const [players, setPlayers] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimer, setSearchTimer] = useState(30)
  const [isHost, setIsHost] = useState(false)
  const [gameStarting, setGameStarting] = useState(false)
  const [startCountdown, setStartCountdown] = useState(5)
  const [roomError, setRoomError] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [creatingRoom, setCreatingRoom] = useState(false)

  const searchIntervalRef = useRef()
  const countdownIntervalRef = useRef()
  const roomDataRef = useRef({ roomCode: "", players: [] })
  const onGameStartRef = useRef(onGameStart)
  
  // Update ref when prop changes
  useEffect(() => {
    onGameStartRef.current = onGameStart
  }, [onGameStart])

  const handleCreateRoom = () => {
    if (!user) return
    setCreatingRoom(true)
    setMode("create")
    rtCreateRoom(game.id)
  }

  const handleOnlinePlay = () => {
    setMode("online")
    setIsSearching(true)
    setSearchTimer(30)
    searchIntervalRef.current = setInterval(() => {
      setSearchTimer((prev) => {
        if (prev <= 1) {
          setIsSearching(false)
          clearInterval(searchIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    rtJoinQueue(game.id)
  }

  const handleMatchFound = (room, newGameState) => {
    console.log('=== MATCH FOUND ===')
    console.log('Room:', room)
    console.log('Room code:', room.roomCode)
    console.log('Room players:', room.players)
    console.log('Game state:', newGameState)
    console.log('onGameStart prop:', onGameStart)
    console.log('onGameStart type:', typeof onGameStart)
    
    setIsSearching(false)
    clearInterval(searchIntervalRef.current)
    
    // Store in ref to preserve across re-renders
    roomDataRef.current = {
      roomCode: room.roomCode,
      players: room.players || []
    }
    
    setPlayers(room.players || [])
    setRoomCode(room.roomCode)
    setIsHost(false) // In matchmaking, no one is "host"
    setMode("waiting")
    
    console.log('State updated - roomCode:', room.roomCode, 'players:', room.players?.length)
    console.log('Stored in ref:', roomDataRef.current)
    console.log('Starting countdown after match found...')
    
    // For matchmaking, game starts automatically after countdown
    // No need to wait for gameStarted event - we'll navigate directly
    startGameCountdown()
  }

  const handleJoinRoom = () => {
    if (!user || roomCode.length !== 6) return

    setRoomError("")
    rtJoinRoom(roomCode)
  }

  const toggleReady = () => {
    if (!user) return
    rtToggleReady(roomCode, !isReady)
    setIsReady(!isReady)
  }

  const startGameCountdown = () => {
    console.log('=== COUNTDOWN START ===')
    console.log('Current startCountdown value:', startCountdown)
    console.log('Current gameStarting value:', gameStarting)
    
    // Clear any existing interval first
    if (countdownIntervalRef.current) {
      console.log('Clearing existing countdown interval')
      clearInterval(countdownIntervalRef.current)
    }
    
    // Set initial state
    setGameStarting(true)
    setStartCountdown(5)
    console.log('Countdown state set to: gameStarting=true, startCountdown=5')

    // Start countdown after a small delay to ensure state is set
    setTimeout(() => {
      console.log('Starting countdown interval...')
      let currentCount = 5
      
      countdownIntervalRef.current = setInterval(() => {
        currentCount--
        console.log('Countdown tick:', currentCount)
        setStartCountdown(currentCount)
        
        if (currentCount <= 0) {
          console.log('Countdown finished, clearing interval and starting game')
          clearInterval(countdownIntervalRef.current)
          setGameStarting(false)
          handleGameStart()
        }
      }, 1000)
      console.log('Interval started with ID:', countdownIntervalRef.current)
    }, 100)
  }

  const handleGameStart = () => {
    console.log('=== GAME START DEBUG ===')
    console.log('handleGameStart called')
    console.log('isHost:', isHost)
    console.log('roomCode (state):', roomCode)
    console.log('roomCode (ref):', roomDataRef.current.roomCode)
    console.log('mode:', mode)
    console.log('players (state):', players)
    console.log('players (ref):', roomDataRef.current.players)
    console.log('onGameStart function:', onGameStart)
    console.log('onGameStart type:', typeof onGameStart)
    
    // Use ref data which is preserved across re-renders
    const actualRoomCode = roomDataRef.current.roomCode || roomCode
    const actualPlayers = roomDataRef.current.players.length > 0 ? roomDataRef.current.players : players
    
    console.log('Using roomCode:', actualRoomCode)
    console.log('Using players:', actualPlayers)
    
    // If host, instruct server to start game and wait for confirmation
    if (isHost && actualRoomCode) {
      console.log('Host starting game on server...')
      rtStartGame(actualRoomCode)
      console.log('Waiting for server gameStarted event...')
    } 
    // For matchmaking, navigate directly (no gameStarted event from server)
    else if (mode === 'online' || mode === 'waiting') {
      console.log('Matchmaking mode - navigating directly')
      
      const onGameStartFn = onGameStartRef.current
      console.log('onGameStart from ref:', onGameStartFn)
      console.log('onGameStart type:', typeof onGameStartFn)
      
      if (typeof onGameStartFn === 'function') {
        console.log('Calling onGameStart for matchmaking')
        try {
          onGameStartFn('online', {
            players: actualPlayers,
            roomCode: actualRoomCode,
            gameState: null
          })
          console.log('onGameStart called successfully')
          onClose()
        } catch (error) {
          console.error('Error calling onGameStart:', error)
        }
      } else {
        console.error('onGameStart is not a function!')
        console.error('onGameStart ref value:', onGameStartRef.current)
        console.error('This should not happen - check HomePage is passing onStartGame prop')
      }
    } 
    else {
      console.warn('Not host and not in matchmaking - cannot start game')
      console.log('isHost:', isHost, 'roomCode:', actualRoomCode, 'mode:', mode)
    }
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy room code",
        variant: "destructive",
      })
    }
  }

  const canStartGame = () => {
    const readyPlayers = players.filter((p) => p.isReady).length
    return readyPlayers >= game.minPlayers && isHost
  }

  // Reset state when modal closes, then opens again
  const prevIsOpenRef = useRef(isOpen)
  
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    const isNowOpen = isOpen
    
    console.log('Modal state change - wasOpen:', wasOpen, 'isNowOpen:', isNowOpen)
    
    // Modal just opened (was closed, now open)
    if (!wasOpen && isNowOpen && game) {
      console.log('Modal opening fresh - resetting all state')
      console.log('Previous mode:', mode, 'gameStarting:', gameStarting, 'roomCode:', roomCode)
      
      // Always reset when opening fresh
      setMode("select")
      setRoomCode("")
      setPlayers([])
      setIsSearching(false)
      setSearchTimer(30)
      setIsHost(false)
      setGameStarting(false)
      setStartCountdown(5)
      setRoomError("")
      setIsReady(false)
      setCreatingRoom(false)
      roomDataRef.current = { roomCode: "", players: [] }
      
      console.log('State reset complete')
    }
    
    // Modal just closed
    if (wasOpen && !isNowOpen) {
      console.log('Modal closed - cleaning up intervals')
      if (searchIntervalRef.current) {
        clearInterval(searchIntervalRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
    
    prevIsOpenRef.current = isOpen
  }, [isOpen, game?.id])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up game modal...')
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      // Leave queue if searching
      if (isSearching && game?.id) rtLeaveQueue(game.id)
      // Leave room if created/joined
      if (roomCode) rtLeaveRoom(roomCode)
    }
  }, [])

  // Register realtime event handlers
  useEffect(() => {
    const onCreated = (data) => {
      console.log('=== ROOM CREATED EVENT ===')
      console.log('Current game:', game?.id)
      console.log('Room data:', data)
      const { roomCode: code, room } = data
      console.log('Room game type:', room.gameType)
      
      // Only process if this event is for the current game
      if (room.gameType !== game?.id) {
        console.warn(`Ignoring room created for ${room.gameType}, current game is ${game?.id}`)
        return
      }
      
      setRoomCode(code)
      setPlayers(room.players || [])
      setIsHost(true)
      setIsReady(true)
      setMode("create")
      setCreatingRoom(false)
      toast({ title: "Room Created", description: `Share code ${code} with friends` })
    }
    const onJoined = (data) => {
      console.log('=== ROOM JOINED EVENT ===')
      console.log('Current game:', game?.id)
      const { room } = data
      console.log('Joined room game type:', room.gameType)
      
      // Only process if this event is for the current game
      if (room.gameType !== game?.id) {
        console.warn(`Ignoring room joined for ${room.gameType}, current game is ${game?.id}`)
        return
      }
      
      setRoomCode(room.roomCode)
      setPlayers(room.players || [])
      setIsHost(false)
      setIsReady(false)
      setMode("create")
      toast({ title: "Joined Room", description: `Room ${room.roomCode}` })
    }
    const onPlayerJoined = (data) => {
      console.log('=== PLAYER JOINED EVENT ===')
      console.log('Current game:', game?.id)
      console.log('Room game type:', data.room?.gameType)
      
      // Only process if this event is for the current game
      if (data.room?.gameType !== game?.id) {
        console.warn(`Ignoring player joined for ${data.room?.gameType}, current game is ${game?.id}`)
        return
      }
      
      setPlayers(data.room?.players || [])
    }
    const onReadyChanged = (data) => {
      console.log('=== READY CHANGED EVENT ===')
      console.log('Current game:', game?.id)
      console.log('Room game type:', data.room?.gameType)
      
      // Only process if this event is for the current game
      if (data.room?.gameType !== game?.id) {
        console.warn(`Ignoring ready changed for ${data.room?.gameType}, current game is ${game?.id}`)
        return
      }
      
      setPlayers(data.room?.players || [])
    }
    const onMatch = (data) => {
      handleMatchFound(data.room, data.gameState)
    }
    const onStarted = (data) => {
      console.log('=== GAME STARTED EVENT ===')
      console.log('onStarted event received:', data)
      console.log('Room:', data.room)
      console.log('Current game:', game?.id)
      console.log('Room game type:', data.room?.gameType)
      console.log('Current mode:', mode)
      console.log('onGameStart callback:', onGameStart)
      console.log('onGameStart type:', typeof onGameStart)
      
      // Only process if this event is for the current game
      if (data.room?.gameType !== game?.id) {
        console.warn(`Ignoring game started for ${data.room?.gameType}, current game is ${game?.id}`)
        return
      }
      
      // Game officially started on server - navigate to game
      if (typeof onGameStart === 'function') {
        const gameMode = mode === 'online' || mode === 'waiting' ? 'online' : 'private'
        console.log('Calling onGameStart with mode:', gameMode)
        console.log('Room data:', {
          players: data.room.players,
          roomCode: data.room.roomCode,
          gameState: data.gameState
        })
        
        try {
          onGameStart(gameMode, { 
            players: data.room.players, 
            roomCode: data.room.roomCode,
            gameState: data.gameState 
          })
          console.log('onGameStart called successfully')
        } catch (error) {
          console.error('Error calling onGameStart:', error)
        }
      } else {
        console.error('onGameStart callback is not defined or not a function!')
        console.error('onGameStart value:', onGameStart)
        console.error('Cannot navigate without proper callback')
      }
      
      console.log('Closing modal...')
      onClose()
    }
    const onError = (err) => {
      setCreatingRoom(false)
      setIsSearching(false)
      if (err?.message) setRoomError(err.message)
      toast({ title: "Action failed", description: err?.message || "Something went wrong", variant: "destructive" })
    }

    registerEventHandler("onRoomCreated", onCreated)
    registerEventHandler("onRoomJoined", onJoined)
    registerEventHandler("onPlayerJoined", onPlayerJoined)
    registerEventHandler("onPlayerReadyChanged", onReadyChanged)
    registerEventHandler("onMatchFound", onMatch)
    registerEventHandler("onGameStarted", onStarted)
    registerEventHandler("onError", onError)
  }, [registerEventHandler, onGameStart, onClose, game?.id, mode])

  if (!game) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] xs:w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-blue-900 border-blue-700 text-white p-4 xs:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg xs:text-xl sm:text-2xl font-bold text-white">
            {game.name}
          </DialogTitle>
        </DialogHeader>

        {/* Game Starting Countdown */}
        {gameStarting && (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">Game Starting!</h3>
              <div className="text-6xl font-bold text-purple-400">{startCountdown}</div>
              <p className="text-gray-300">Get ready to play {game.name}</p>
            </div>
            <Progress value={(5 - startCountdown) * 20} className="w-full" />
          </div>
        )}

        {/* Mode Selection */}
        {mode === "select" && !gameStarting && (
          <div className="space-y-3 xs:space-y-4">
            <p className="text-gray-300 text-center text-sm xs:text-base">Choose how you want to play {game.name}</p>

            <div className="space-y-2 xs:space-y-3">
              <Button
                className="w-full justify-start gap-2 xs:gap-3 h-auto p-3 xs:p-4 bg-white/10 hover:bg-white/20 border-white/20"
                variant="outline"
                onClick={handleCreateRoom}
              >
                <div className="bg-blue-500 rounded-full p-1.5 xs:p-2">
                  <Users className="h-3 w-3 xs:h-4 xs:w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white text-sm xs:text-base">Play with Friends</p>
                  <p className="text-xs xs:text-sm text-gray-300">Create a private room</p>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-2 xs:gap-3 h-auto p-3 xs:p-4 bg-white/10 hover:bg-white/20 border-white/20"
                variant="outline"
                onClick={handleOnlinePlay}
              >
                <div className="bg-green-500 rounded-full p-1.5 xs:p-2">
                  <Globe className="h-3 w-3 xs:h-4 xs:w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white text-sm xs:text-base">Online Multiplayer</p>
                  <p className="text-xs xs:text-sm text-gray-300">Match with random players</p>
                </div>
              </Button>

              <Button
                className="w-full justify-start gap-2 xs:gap-3 h-auto p-3 xs:p-4 bg-white/10 hover:bg-white/20 border-white/20"
                variant="outline"
                onClick={() => setMode("join")}
              >
                <div className="bg-purple-500 rounded-full p-1.5 xs:p-2">
                  <Hash className="h-3 w-3 xs:h-4 xs:w-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-white text-sm xs:text-base">Join with Room Code</p>
                  <p className="text-xs xs:text-sm text-gray-300">Enter a 6-character code</p>
                </div>
              </Button>
            </div>
          </div>
        )}
        {mode === "join" && (
          <div className="space-y-3 xs:space-y-4">
            <p className="text-gray-300 text-sm xs:text-base">Enter a 6-character room code</p>
            <input
              className="w-full p-2 xs:p-3 rounded bg-gray-800 text-white border border-gray-700 text-sm xs:text-base"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
            />
            {roomError && <p className="text-red-400 text-xs xs:text-sm">{roomError}</p>}
            <div className="flex gap-2">
              <Button className="flex-1 bg-white text-slate-900 hover:bg-blue-100 text-xs xs:text-sm py-2" onClick={handleJoinRoom} disabled={roomCode.length !== 6}>Join</Button>
              <Button className="flex-1 bg-white text-slate-900 hover:bg-blue-100 text-xs xs:text-sm py-2" onClick={() => setMode("select")}>Back</Button>
            </div>
          </div>
        )}

        {/* Create/Waiting Room Lobby */}
        {mode === "create" && (
          <div className="space-y-3 xs:space-y-4">
            {creatingRoom ? (
              <div className="text-center text-gray-300 text-sm xs:text-base">Creating room...</div>
            ) : (
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                <p className="text-gray-300 text-sm xs:text-base">Room Code: <span className="font-mono text-white text-base xs:text-lg">{roomCode}</span></p>
                <div className="flex gap-2">
                  <Button className="bg-white text-slate-900 hover:bg-blue-100 text-xs xs:text-sm py-1.5 xs:py-2" onClick={copyRoomCode}>Copy</Button>
                  <Button className="bg-red-600 text-white hover:bg-red-700 text-xs xs:text-sm py-1.5 xs:py-2" onClick={() => rtLeaveRoom(roomCode)}>Leave</Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-white font-medium text-sm xs:text-base">Players</p>
              <div className="grid grid-cols-1 gap-2">
                {players.map((p) => (
                  <div key={p.userId || p.id} className="flex items-center justify-between bg-white/5 rounded px-2 xs:px-3 py-1.5 xs:py-2">
                    <span className="text-white text-sm xs:text-base">{p.username}</span>
                    <span className={`text-xs ${p.isReady ? 'text-green-400' : 'text-yellow-300'}`}>{p.isReady ? 'Ready' : 'Not Ready'}</span>
                  </div>
                ))}
              </div>
            </div>
            {players.length < (game.minPlayers || 2) && (
              <p className="text-xs xs:text-sm text-blue-300">Waiting for other players to join...</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <Button onClick={toggleReady} className={`${isReady ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-slate-900 hover:bg-blue-100'} text-xs xs:text-sm py-2`}>
                {isReady ? 'Unready' : 'Ready'}
              </Button>
              <Button onClick={handleGameStart} disabled={!canStartGame()} className={`${canStartGame() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/20 text-white/60 cursor-not-allowed'} text-xs xs:text-sm py-2`}>
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* Online Searching */}
        {mode === "online" && (
          <div className="space-y-3 xs:space-y-4 text-center">
            <p className="text-gray-300 text-sm xs:text-base">Searching for players... {searchTimer}s</p>
            <Progress value={((30 - searchTimer) / 30) * 100} className="w-full" />
            <Button className="bg-white text-slate-900 hover:bg-blue-100 border border-white text-xs xs:text-sm py-2" onClick={() => { rtLeaveQueue(game.id); setIsSearching(false); setMode('select'); }}>Cancel</Button>
          </div>
        )}

        {/* Waiting to start after match */}
        {mode === "waiting" && !gameStarting && (
          <div className="space-y-4 text-center">
            <p className="text-gray-300">Match found! Starting in {startCountdown}s</p>
            <Progress value={(5 - startCountdown) * 20} className="w-full" />
          </div>
        )}

        {/* Room Creation/Lobby, Join Room, Online Matchmaking, and Waiting modes remain the same structure but with updated styling */}
      </DialogContent>
    </Dialog>
  )
}

export { GameModal }
