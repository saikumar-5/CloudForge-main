"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"
import { useRealtime } from "../../contexts/realtime-context"
import BaseGameLayout from './base-game-layout.jsx'

export const TicTacToePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { makeMove, registerEventHandler, gameState: realtimeGameState } = useRealtime()
  const { gameMode, roomData, gameInfo } = location.state || {}

  const [board, setBoard] = useState(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState("X")
  const [winner, setWinner] = useState(null)
  const [gameStatus, setGameStatus] = useState("playing")
  const [mySymbol, setMySymbol] = useState(null) // X or O
  const [isMyTurn, setIsMyTurn] = useState(false)

  console.log('=== TIC TAC TOE PAGE ===')
  console.log('Game mode:', gameMode)
  console.log('Room data:', roomData)
  console.log('My user ID:', user?.id)
  console.log('My symbol:', mySymbol)
  console.log('Is my turn:', isMyTurn)
  console.log('Current player:', currentPlayer)

  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ]

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a]
      }
    }
    return null
  }

  const handleCellClick = (index) => {
    console.log('=== CELL CLICKED ===')
    console.log('Cell index:', index)
    console.log('My symbol:', mySymbol)
    console.log('Current player:', currentPlayer)
    console.log('Is my turn:', isMyTurn)
    console.log('Board cell:', board[index])
    console.log('Game status:', gameStatus)
    console.log('Room code:', roomData?.roomCode)
    
    // Check if it's a valid move
    if (board[index]) {
      console.log('❌ Invalid move: cell already occupied')
      return
    }
    
    if (winner || gameStatus !== "playing") {
      console.log('❌ Invalid move: game is over')
      return
    }
    
    // Check if it's my turn
    if (!isMyTurn) {
      console.log('❌ Not my turn! Waiting for opponent...')
      return
    }

    // For online/multiplayer mode, send move to server
    if (gameMode === 'online' || gameMode === 'private') {
      console.log('✅ Valid move - sending to server')
      console.log('Move data:', { position: index, roomCode: roomData?.roomCode })
      
      try {
        makeMove(roomData?.roomCode, { position: index })
        console.log('Move sent successfully')
      } catch (error) {
        console.error('Error sending move:', error)
      }
    } else {
      // Local mode - update immediately
      const newBoard = [...board]
      newBoard[index] = currentPlayer
      setBoard(newBoard)

      const gameWinner = checkWinner(newBoard)
      if (gameWinner) {
        setWinner(gameWinner)
        setGameStatus("finished")
      } else if (newBoard.every((cell) => cell !== null)) {
        setGameStatus("draw")
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X")
      }
    }
  }

  // Initialize player symbols and game state
  useEffect(() => {
    if (!roomData?.players || !user) return

    console.log('Initializing player symbols...')
    console.log('Players:', roomData.players)
    console.log('My user ID:', user.id)
    console.log('Game state from roomData:', roomData.gameState)
    
    // Assign symbols based on player order
    const myPlayerIndex = roomData.players.findIndex(p => p.userId === user.id)
    console.log('My player index:', myPlayerIndex)
    
    if (myPlayerIndex === 0) {
      setMySymbol('X')
      setIsMyTurn(true) // X goes first
      console.log('I am X (first player)')
    } else if (myPlayerIndex === 1) {
      setMySymbol('O')
      setIsMyTurn(false)
      console.log('I am O (second player)')
    }
    
    // Initialize board from game state if available
    if (roomData.gameState) {
      console.log('Initializing board from game state')
      const { board: initialBoard, currentPlayer: currentPlayerIndex, players: gamePlayers } = roomData.gameState
      
      if (initialBoard) {
        setBoard(initialBoard)
      }
      
      if (gamePlayers && typeof currentPlayerIndex === 'number') {
        const currentPlayerSymbol = gamePlayers[currentPlayerIndex]?.symbol || 'X'
        setCurrentPlayer(currentPlayerSymbol)
        
        const currentPlayerId = gamePlayers[currentPlayerIndex]?.userId
        setIsMyTurn(currentPlayerId === user.id)
        
        console.log('Initial current player:', currentPlayerSymbol)
        console.log('Initial is my turn:', currentPlayerId === user.id)
      }
    }
  }, [roomData, user])

  // Listen for game state updates from server
  useEffect(() => {
    const onGameStateUpdated = (data) => {
      console.log('=== GAME STATE UPDATED ===')
      console.log('Full data:', data)
      console.log('Game state:', data.gameState)
      
      if (data.gameState) {
        const { board: newBoard, currentPlayer: currentPlayerIndex, players: gamePlayers, winner: newWinner, gameOver, isDraw } = data.gameState
        
        console.log('Updating board:', newBoard)
        console.log('Current player index:', currentPlayerIndex)
        console.log('Game players:', gamePlayers)
        console.log('Winner:', newWinner)
        console.log('Game over:', gameOver)
        
        // Get the symbol of the current player
        const currentPlayerSymbol = gamePlayers && gamePlayers[currentPlayerIndex] 
          ? gamePlayers[currentPlayerIndex].symbol 
          : 'X'
        
        console.log('Current player symbol:', currentPlayerSymbol)
        
        setBoard(newBoard)
        setCurrentPlayer(currentPlayerSymbol)
        
        // Update turn - check if current player index matches my user ID
        if (user && gamePlayers) {
          const currentPlayerId = gamePlayers[currentPlayerIndex]?.userId
          const myTurn = currentPlayerId === user.id
          console.log('Current player ID:', currentPlayerId)
          console.log('My user ID:', user.id)
          console.log('Is my turn now?', myTurn)
          setIsMyTurn(myTurn)
        }
        
        if (gameOver) {
          if (newWinner) {
            // Winner is a userId from backend
            console.log('Winner userId:', newWinner)
            setWinner(newWinner)
            setGameStatus('finished')
          } else if (isDraw) {
            setGameStatus('draw')
          }
        }
      }
    }

    const onGameOver = (data) => {
      console.log('=== GAME OVER ===')
      console.log('Winner:', data.winner)
      console.log('Game state:', data.gameState)
      
      if (data.winner) {
        setWinner(data.winner)
        setGameStatus('finished')
      } else {
        setGameStatus('draw')
      }
    }

    registerEventHandler('onGameStateUpdated', onGameStateUpdated)
    registerEventHandler('onGameOver', onGameOver)
    
    return () => {
      // Cleanup if needed
    }
  }, [registerEventHandler, mySymbol, user])

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setCurrentPlayer("X")
    setWinner(null)
    setGameStatus("playing")
    if (mySymbol === 'X') {
      setIsMyTurn(true)
    } else {
      setIsMyTurn(false)
    }
  }

  const handleGameEnd = (result) => {
    if (result === "exit") {
      navigate("/home")
    } else {
      resetGame()
    }
  }

  return (
    <BaseGameLayout
      gameInfo={gameInfo || { name: "Tic Tac Toe", id: "tic-tac-toe" }}
      gameMode={gameMode}
      roomData={roomData}
      gameStatus={gameStatus}
      winner={winner}
      onGameEnd={handleGameEnd}
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Tic Tac Toe</h2>
          {mySymbol && (
            <p className="text-blue-300 mb-2">
              You are: <span className="font-bold text-white text-xl">{mySymbol}</span>
            </p>
          )}
          {gameStatus === "playing" && (
            <div>
              <p className="text-purple-200">
                Current Turn: <span className="font-bold text-white">{currentPlayer}</span>
              </p>
              {isMyTurn ? (
                <p className="text-green-400 font-bold mt-1">Your Turn!</p>
              ) : (
                <p className="text-yellow-400 font-bold mt-1">Opponent's Turn</p>
              )}
            </div>
          )}
          {gameStatus === "finished" && (
            <p className={`font-bold ${winner === mySymbol ? 'text-green-400' : 'text-red-400'}`}>
              {winner === mySymbol ? 'You Win!' : `${winner} Wins!`}
            </p>
          )}
          {gameStatus === "draw" && <p className="text-yellow-400 font-bold">It's a Draw!</p>}
        </div>

        <div className="grid grid-cols-3 gap-2 bg-white/10 p-4 rounded-lg">
          {board.map((cell, index) => (
            <button
              key={index}
              className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-3xl font-bold text-white transition-colors"
              onClick={() => handleCellClick(index)}
              disabled={cell !== null || gameStatus !== "playing"}
            >
              {cell}
            </button>
          ))}
        </div>

        {gameStatus !== "playing" && (
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Play Again
          </button>
        )}
      </div>
    </BaseGameLayout>
  )
}

