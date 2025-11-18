"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"
import { useRealtime } from "../../contexts/realtime-context"
import BaseGameLayout from './base-game-layout.jsx'

export const Connect4Page = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { makeMove, registerEventHandler, gameState: realtimeGameState } = useRealtime()
  const { gameMode, roomData, gameInfo } = location.state || {}

  const ROWS = 6
  const COLS = 7
  
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
  const [currentPlayer, setCurrentPlayer] = useState("red")
  const [winner, setWinner] = useState(null)
  const [gameStatus, setGameStatus] = useState("playing")
  const [myColor, setMyColor] = useState(null) // red or yellow
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [lastMove, setLastMove] = useState(null)

  console.log('=== CONNECT 4 PAGE ===')
  console.log('Game mode:', gameMode)
  console.log('Room data:', roomData)
  console.log('My user ID:', user?.id)
  console.log('My color:', myColor)
  console.log('Is my turn:', isMyTurn)
  console.log('Current player:', currentPlayer)

  const checkWinner = (board, row, col, color) => {
    // Check horizontal
    if (checkDirection(board, row, col, 0, 1, color)) return true
    // Check vertical
    if (checkDirection(board, row, col, 1, 0, color)) return true
    // Check diagonal (down-right)
    if (checkDirection(board, row, col, 1, 1, color)) return true
    // Check diagonal (down-left)
    if (checkDirection(board, row, col, 1, -1, color)) return true

    return false
  }

  const checkDirection = (board, row, col, dRow, dCol, color) => {
    let count = 1

    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + (dRow * i)
      const c = col + (dCol * i)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
        count++
      } else {
        break
      }
    }

    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - (dRow * i)
      const c = col - (dCol * i)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
        count++
      } else {
        break
      }
    }

    return count >= 4
  }

  const isBoardFull = (board) => {
    return board[0].every(cell => cell !== null)
  }

  const handleColumnClick = (col) => {
    console.log('=== COLUMN CLICKED ===')
    console.log('Column:', col)
    console.log('My color:', myColor)
    console.log('Current player:', currentPlayer)
    console.log('Is my turn:', isMyTurn)
    console.log('Game status:', gameStatus)
    console.log('Room code:', roomData?.roomCode)
    
    // Check if it's a valid move
    if (board[0][col] !== null) {
      console.log('❌ Invalid move: column is full')
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
      console.log('Move data:', { column: col, roomCode: roomData?.roomCode })
      
      try {
        makeMove(roomData?.roomCode, { column: col })
        console.log('Move sent successfully')
      } catch (error) {
        console.error('Error sending move:', error)
      }
    } else {
      // Local mode - update immediately
      const newBoard = board.map(row => [...row])
      
      // Find the lowest empty row in the column
      let row = -1
      for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r][col] === null) {
          row = r
          break
        }
      }

      if (row === -1) {
        console.log('❌ Column is full')
        return
      }

      // Make the move
      newBoard[row][col] = currentPlayer
      setBoard(newBoard)
      setLastMove({ row, col })

      // Check for winner
      if (checkWinner(newBoard, row, col, currentPlayer)) {
        setWinner(currentPlayer)
        setGameStatus("finished")
      } else if (isBoardFull(newBoard)) {
        setGameStatus("draw")
      } else {
        setCurrentPlayer(currentPlayer === "red" ? "yellow" : "red")
      }
    }
  }

  // Initialize player colors and game state
  useEffect(() => {
    if (!roomData?.players || !user) return

    console.log('Initializing player colors...')
    console.log('Players:', roomData.players)
    console.log('My user ID:', user.id)
    console.log('Game state from roomData:', roomData.gameState)
    
    // Assign colors based on player order
    const myPlayerIndex = roomData.players.findIndex(p => p.userId === user.id)
    console.log('My player index:', myPlayerIndex)
    
    if (myPlayerIndex === 0) {
      setMyColor('red')
      setIsMyTurn(true) // red goes first
      console.log('I am red (first player)')
    } else if (myPlayerIndex === 1) {
      setMyColor('yellow')
      setIsMyTurn(false)
      console.log('I am yellow (second player)')
    }
    
    // Initialize board from game state if available
    if (roomData.gameState) {
      console.log('Initializing board from game state')
      const { board: initialBoard, currentPlayer: currentPlayerIndex, players: gamePlayers, lastMove: initialLastMove } = roomData.gameState
      
      if (initialBoard) {
        setBoard(initialBoard)
      }
      
      if (initialLastMove) {
        setLastMove(initialLastMove)
      }
      
      if (gamePlayers && typeof currentPlayerIndex === 'number') {
        const currentPlayerColor = gamePlayers[currentPlayerIndex]?.color || 'red'
        setCurrentPlayer(currentPlayerColor)
        
        const currentPlayerId = gamePlayers[currentPlayerIndex]?.userId
        setIsMyTurn(currentPlayerId === user.id)
        
        console.log('Initial current player:', currentPlayerColor)
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
        const { board: newBoard, currentPlayer: currentPlayerIndex, players: gamePlayers, winner: newWinner, gameOver, isDraw, lastMove: newLastMove } = data.gameState
        
        console.log('Updating board:', newBoard)
        console.log('Current player index:', currentPlayerIndex)
        console.log('Game players:', gamePlayers)
        console.log('Winner:', newWinner)
        console.log('Game over:', gameOver)
        console.log('Last move:', newLastMove)
        
        // Get the color of the current player
        const currentPlayerColor = gamePlayers && gamePlayers[currentPlayerIndex] 
          ? gamePlayers[currentPlayerIndex].color 
          : 'red'
        
        console.log('Current player color:', currentPlayerColor)
        
        // Deep copy the board to ensure proper state update
        if (newBoard) {
          setBoard(newBoard.map(row => [...row]))
        }
        setCurrentPlayer(currentPlayerColor)
        
        if (newLastMove) {
          setLastMove(newLastMove)
        }
        
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
  }, [registerEventHandler, myColor, user])

  const resetGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)))
    setCurrentPlayer("red")
    setWinner(null)
    setGameStatus("playing")
    setLastMove(null)
    if (myColor === 'red') {
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
      gameInfo={gameInfo || { name: "Connect 4", id: "connect4" }}
      gameMode={gameMode}
      roomData={roomData}
      gameStatus={gameStatus}
      winner={winner}
      onGameEnd={handleGameEnd}
    >
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Connect 4</h2>
          {myColor && (
            <p className="text-blue-300 mb-2">
              You are: <span className={`font-bold text-white text-xl ${myColor === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>
                {myColor === 'red' ? '🔴 Red' : '🟡 Yellow'}
              </span>
            </p>
          )}
          {gameStatus === "playing" && (
            <div>
              <p className="text-purple-200">
                Current Turn: <span className={`font-bold text-white ${currentPlayer === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {currentPlayer === 'red' ? '🔴 Red' : '🟡 Yellow'}
                </span>
              </p>
              {isMyTurn ? (
                <p className="text-green-400 font-bold mt-1">Your Turn!</p>
              ) : (
                <p className="text-yellow-400 font-bold mt-1">Opponent's Turn</p>
              )}
            </div>
          )}
          {gameStatus === "finished" && (
            <p className={`font-bold ${winner === myColor ? 'text-green-400' : 'text-red-400'}`}>
              {winner === myColor ? 'You Win!' : `${winner === 'red' ? '🔴 Red' : '🟡 Yellow'} Wins!`}
            </p>
          )}
          {gameStatus === "draw" && <p className="text-yellow-400 font-bold">It's a Draw!</p>}
        </div>

        <div className="bg-blue-600 p-4 rounded-lg shadow-2xl">
          <div className="grid grid-cols-7 gap-1">
            {board.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-12 h-12 rounded-full border-2 border-blue-800 transition-all duration-300 ${
                    cell === 'red' 
                      ? 'bg-red-500 shadow-inner' 
                      : cell === 'yellow' 
                        ? 'bg-yellow-400 shadow-inner'
                        : 'bg-blue-100 hover:bg-blue-200'
                  } ${
                    lastMove?.row === rowIndex && lastMove?.col === colIndex 
                      ? 'ring-2 ring-white ring-opacity-60' 
                      : ''
                  }`}
                  onClick={() => handleColumnClick(colIndex)}
                  disabled={gameStatus !== "playing" || !isMyTurn || board[0][colIndex] !== null}
                />
              ))
            ))}
          </div>
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
