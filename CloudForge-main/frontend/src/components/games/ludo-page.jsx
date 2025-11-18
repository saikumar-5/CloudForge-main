import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import { useRealtime } from '../../contexts/realtime-context'
import BaseGameLayout from './base-game-layout'
import { Button } from '../ui/button'

const LudoPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { makeMove, registerEventHandler } = useRealtime()
  const { gameMode, roomData, gameInfo } = location.state || {}

  // Ludo game state
  const [board, setBoard] = useState(initializeBoard())
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [diceValue, setDiceValue] = useState(null)
  const [gameStatus, setGameStatus] = useState('playing')
  const [winner, setWinner] = useState(null)
  const [playerColors] = useState(['red', 'blue', 'green', 'yellow'])
  const [myPlayerIndex, setMyPlayerIndex] = useState(0)
  const [canRollDice, setCanRollDice] = useState(true) // Fixed: Start with true
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [isRolling, setIsRolling] = useState(false)

  function initializeBoard() {
    const players = []
    for (let i = 0; i < 4; i++) {
      players.push({
        pieces: [
          { id: `${i}-0`, position: -1, isHome: true, isSafe: false },
          { id: `${i}-1`, position: -1, isHome: true, isSafe: false },
          { id: `${i}-2`, position: -1, isHome: true, isSafe: false },
          { id: `${i}-3`, position: -1, isHome: true, isSafe: false }
        ],
        color: ['red', 'blue', 'green', 'yellow'][i],
        startPosition: i * 13,
        homePositions: [i * 13 + 1, i * 13 + 2, i * 13 + 3, i * 13 + 4, i * 13 + 5, i * 13 + 6]
      })
    }
    return { players, boardSize: 52 }
  }

  const rollDice = () => {
    console.log('=== DICE ROLL ATTEMPT ===')
    console.log('Can roll dice:', canRollDice)
    console.log('Current player:', currentPlayer)
    console.log('My player index:', myPlayerIndex)
    console.log('Is rolling:', isRolling)
    
    if (!canRollDice || isRolling) {
      console.log('❌ Cannot roll dice')
      return
    }
    
    setIsRolling(true)
    setCanRollDice(false)
    
    // Animate dice roll
    let rollCount = 0
    const rollInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      rollCount++
      
      if (rollCount >= 10) {
        clearInterval(rollInterval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setIsRolling(false)
        
        console.log('✅ Dice rolled:', finalValue)
        
        // Send move to server for online games
        if (gameMode === 'online' || gameMode === 'private') {
          makeMove(roomData?.roomCode, { action: 'roll', value: finalValue })
        }
        
        // Check if player has valid moves
        setTimeout(() => {
          checkValidMoves(finalValue)
        }, 500)
      }
    }, 100)
  }

  const checkValidMoves = (diceVal) => {
    const player = board.players[currentPlayer]
    let hasValidMove = false
    
    player.pieces.forEach(piece => {
      if (piece.isHome && diceVal === 6) {
        hasValidMove = true
      } else if (!piece.isHome && piece.position + diceVal <= 52) {
        hasValidMove = true
      }
    })
    
    if (!hasValidMove) {
      // No valid moves, next player's turn
      setTimeout(() => {
        nextTurn(diceVal)
      }, 1000)
    }
  }

  const movePiece = (playerIndex, pieceIndex) => {
    console.log('=== PIECE MOVE ATTEMPT ===')
    console.log('Player index:', playerIndex)
    console.log('Piece index:', pieceIndex)
    console.log('Dice value:', diceValue)
    console.log('Current player:', currentPlayer)
    
    if (currentPlayer !== myPlayerIndex || !diceValue || isRolling) {
      console.log('❌ Invalid move conditions')
      return
    }
    
    const newBoard = { ...board }
    const piece = newBoard.players[playerIndex].pieces[pieceIndex]
    
    console.log('Moving piece:', piece)
    
    // Move logic
    if (piece.isHome && diceValue === 6) {
      piece.position = newBoard.players[playerIndex].startPosition
      piece.isHome = false
      console.log('✅ Piece moved out of home')
    } else if (!piece.isHome) {
      const newPosition = piece.position + diceValue
      if (newPosition <= 52) {
        piece.position = newPosition
        console.log('✅ Piece moved to position:', newPosition)
      } else {
        console.log('❌ Move would exceed board')
        return
      }
    } else {
      console.log('❌ Need 6 to move out of home')
      return
    }
    
    setBoard(newBoard)
    setSelectedPiece(null)
    
    // Send move to server for online games
    if (gameMode === 'online' || gameMode === 'private') {
      makeMove(roomData?.roomCode, { 
        action: 'move', 
        playerIndex, 
        pieceIndex, 
        diceValue 
      })
    }
    
    nextTurn(diceValue)
  }

  const nextTurn = (diceVal) => {
    setDiceValue(null)
    
    // Next player's turn (unless rolled 6)
    if (diceVal !== 6) {
      setCurrentPlayer((prev) => (prev + 1) % 4)
    }
    setCanRollDice(true)
  }

  const handleGameEnd = (result) => {
    if (result === "exit") {
      navigate("/home")
    } else {
      // Reset game
      setBoard(initializeBoard())
      setCurrentPlayer(0)
      setDiceValue(null)
      setGameStatus('playing')
      setWinner(null)
      setCanRollDice(true)
    }
  }

  const getDiceEmoji = (value) => {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
    return value ? diceEmojis[value - 1] : '🎲'
  }

  const getPieceEmoji = (color) => {
    const pieceEmojis = {
      red: '🔴',
      blue: '🔵', 
      green: '🟢',
      yellow: '🟡'
    }
    return pieceEmojis[color] || '⚪'
  }

  return (
    <BaseGameLayout
      gameInfo={gameInfo || { name: "Ludo", id: "ludo" }}
      gameMode={gameMode}
      roomData={roomData}
      gameStatus={gameStatus}
      winner={winner}
      onGameEnd={handleGameEnd}
    >
      <div className="flex flex-col items-center space-y-6 p-4">
        {/* Enhanced Game Header */}
        <div className="text-center bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-2">
            🎲 <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Ludo Game</span>
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="bg-gray-800/50 rounded-lg px-4 py-2">
              <p className="text-blue-300 text-sm">Current Player:</p>
              <p className={`font-bold text-lg text-${playerColors[currentPlayer]}-400`}>
                {getPieceEmoji(playerColors[currentPlayer])} {playerColors[currentPlayer].toUpperCase()}
              </p>
            </div>
            {currentPlayer === myPlayerIndex && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-lg px-4 py-2 animate-pulse">
                <p className="text-green-400 font-semibold">🎯 Your Turn!</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Dice Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-gray-600/50 shadow-2xl">
          <div className="text-center">
            <div className={`text-8xl mb-6 transition-all duration-300 ${isRolling ? 'animate-spin' : 'hover:scale-110'}`}>
              {getDiceEmoji(diceValue)}
            </div>
            <div className="space-y-3">
              <Button
                onClick={rollDice}
                disabled={!canRollDice || currentPlayer !== myPlayerIndex || isRolling}
                className={`
                  bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                  text-white font-bold py-3 px-8 rounded-xl text-lg
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transform transition-all duration-200 hover:scale-105 active:scale-95
                  shadow-lg hover:shadow-xl
                  ${isRolling ? 'animate-pulse' : ''}
                `}
              >
                {isRolling ? '🎲 Rolling...' : diceValue ? `🎯 Rolled: ${diceValue}` : '🎲 Roll Dice'}
              </Button>
              {diceValue && !isRolling && (
                <p className="text-yellow-300 text-sm animate-bounce">
                  Click a piece to move!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Ludo Board */}
        <div className="relative bg-gradient-to-br from-green-100 to-green-200 rounded-2xl shadow-2xl border-4 border-yellow-600 p-4">
          <div className="w-[500px] h-[500px] relative">
            
            {/* Player Home Areas */}
            {board.players.map((player, playerIndex) => (
              <div
                key={playerIndex}
                className={`
                  absolute bg-gradient-to-br from-${player.color}-200 to-${player.color}-300 
                  border-3 border-${player.color}-500 rounded-xl shadow-lg
                  transition-all duration-300 hover:shadow-xl
                `}
                style={{
                  width: '180px',
                  height: '180px',
                  top: playerIndex < 2 ? '20px' : '300px',
                  left: playerIndex % 2 === 0 ? '20px' : '300px'
                }}
              >
                <div className="p-3 h-full">
                  <div className={`text-${player.color}-800 font-bold text-lg mb-3 text-center flex items-center justify-center gap-2`}>
                    {getPieceEmoji(player.color)} {player.color.toUpperCase()}
                    {playerIndex === currentPlayer && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full animate-pulse">
                        TURN
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 h-24">
                    {player.pieces.map((piece, pieceIndex) => (
                      <button
                        key={piece.id}
                        onClick={() => movePiece(playerIndex, pieceIndex)}
                        className={`
                          w-12 h-12 rounded-full border-3 border-${player.color}-700 
                          transition-all duration-200 text-2xl
                          ${piece.isHome ? 'opacity-100 hover:scale-125' : 'opacity-40'} 
                          ${selectedPiece === piece.id ? 'ring-4 ring-white ring-opacity-80 scale-110' : ''}
                          ${currentPlayer === myPlayerIndex && diceValue && !isRolling ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'}
                          disabled:opacity-30
                        `}
                        disabled={currentPlayer !== myPlayerIndex || !diceValue || isRolling}
                        style={{
                          backgroundColor: piece.isHome ? 
                            `rgb(${player.color === 'red' ? '239, 68, 68' : player.color === 'blue' ? '59, 130, 246' : player.color === 'green' ? '34, 197, 94' : '234, 179, 8'})` : 
                            'rgba(156, 163, 175, 0.5)'
                        }}
                      >
                        {getPieceEmoji(player.color)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced Center Star */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-3xl shadow-2xl border-4 border-yellow-600 animate-pulse">
              ⭐
            </div>

            {/* Board Path Indicators */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top path */}
              <div className="absolute top-[90px] left-[240px] w-[20px] h-[120px] bg-white/30 rounded"></div>
              {/* Right path */}
              <div className="absolute top-[240px] right-[90px] w-[120px] h-[20px] bg-white/30 rounded"></div>
              {/* Bottom path */}
              <div className="absolute bottom-[90px] left-[240px] w-[20px] h-[120px] bg-white/30 rounded"></div>
              {/* Left path */}
              <div className="absolute top-[240px] left-[90px] w-[120px] h-[20px] bg-white/30 rounded"></div>
            </div>
          </div>
        </div>

        {/* Enhanced Game Instructions */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm rounded-xl p-6 border border-indigo-500/30 max-w-lg shadow-xl">
          <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
            📋 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">How to Play</span>
          </h3>
          <ul className="text-gray-300 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">🎯</span>
              <span>Roll <strong className="text-yellow-300">6</strong> to move pieces out of home</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">🔄</span>
              <span>Move pieces clockwise around the board</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">🏆</span>
              <span>Get all 4 pieces to the center to win</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">🎲</span>
              <span>Rolling <strong className="text-yellow-300">6</strong> gives you another turn</span>
            </li>
          </ul>
        </div>
      </div>
    </BaseGameLayout>
  )
}

export default LudoPage


