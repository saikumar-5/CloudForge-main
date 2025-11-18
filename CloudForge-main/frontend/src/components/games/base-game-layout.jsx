"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { X, Wifi, WifiOff } from "lucide-react"
import { ConnectionStatus } from "../realtime/connection-status"
import { ChatPanel } from "../realtime/chat-panel"

const BaseGameLayout = ({ children, gameInfo, gameMode, roomData, gameStatus, winner, onGameEnd }) => {
  const navigate = useNavigate()
  const { user, updateCoins, updateGameStats } = useAuth()
  const [confetti, setConfetti] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showRejoinModal, setShowRejoinModal] = useState(false)
  const [rejoinTimer, setRejoinTimer] = useState(30)
  const [isConnected, setIsConnected] = useState(true)
  const [showChat, setShowChat] = useState(false)

  // Handle game completion
  useEffect(() => {
    if (gameStatus === "finished" || gameStatus === "draw") {
      setShowResultModal(true)

      // Determine winner status for rewards/animations
      // winner is a userId from backend, compare directly with user.id
      const isWinner = gameStatus === "finished" && winner && user && winner === user.id

      // Trigger confetti on win
      setConfetti(isWinner)

      if (gameStatus === "finished") {
        if (isWinner) {
          updateGameStats(true, 100) // Winner gets 100 coins
        } else {
          updateGameStats(false, 10) // Consolation for loss
        }
      } else {
        updateGameStats(false, 50) // Draw reward
      }
    }
  }, [gameStatus, winner, user, updateCoins, updateGameStats])

  // Simulate network issues
  useEffect(() => {
    const networkInterval = setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance of network issue
        setIsConnected(false)
        setShowRejoinModal(true)
        setRejoinTimer(30)

        const rejoinInterval = setInterval(() => {
          setRejoinTimer((prev) => {
            if (prev <= 1) {
              clearInterval(rejoinInterval)
              setIsConnected(true)
              setShowRejoinModal(false)
              return 30
            }
            return prev - 1
          })
        }, 1000)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(networkInterval)
  }, [])

  const handleExit = () => {
    setShowExitModal(true)
  }

  const confirmExit = () => {
    setShowExitModal(false)
    navigate("/home")
  }

  const handleResultAction = (action) => {
    setShowResultModal(false)
    if (onGameEnd) {
      onGameEnd(action)
    }
  }

  const getCoinsEarned = () => {
    if (gameStatus === "draw") return 50
    if (gameStatus === "finished") {
      // winner is a userId from backend, compare directly with user.id
      const isWinner = winner && user && winner === user.id

      if (isWinner) {
        return 100
      }
      return 10
    }
    return 0
  }

  return (
    <div className="min-h-screen p-4">
      <ConnectionStatus />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {gameInfo?.name || "Game"}
          </h1>
          <div className="flex items-center gap-2 bg-gray-700/50 rounded-full px-3 py-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
            )}
            <span className="text-xs font-medium text-gray-300">
              {isConnected ? "Connected" : "Reconnecting..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Enhanced Coins Display */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-500/30 shadow-lg">
            <span className="text-yellow-300 font-bold text-sm flex items-center gap-1">
              <span className="text-lg">🪙</span>
              {user?.coins?.toLocaleString() || 0}
            </span>
          </div>

          {/* Enhanced Chat Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className={`text-white hover:bg-blue-500/20 border border-blue-500/30 transition-all ${
              showChat ? 'bg-blue-500/20 border-blue-400' : ''
            }`}
          >
            💬 Chat {showChat ? '✓' : ''}
          </Button>

          {/* Enhanced Exit Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExit} 
            className="text-white hover:bg-red-500/20 border border-red-500/30 hover:border-red-400 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex gap-4">
        <div className="flex-1">{children}</div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80">
            <ChatPanel roomId={roomData?.roomCode || "game-room"} />
          </div>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Exit Game?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">Are you sure you want to exit the game? Your progress will be lost.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExitModal(false)}
                className="flex-1 border-gray-600 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button onClick={confirmExit} className="flex-1 bg-red-600 hover:bg-red-700">
                Exit Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Result Modal */}
      <Dialog open={showResultModal} onOpenChange={() => {}}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-center text-white text-2xl">
              {gameStatus === "draw"
                ? "It's a Draw!"
                : winner && user && winner === user.id
                  ? "🎉 YOU WON! 🎉"
                  : "Game Over"}
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {/* Confetti layer when win */}
            {confetti && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="animate-ping absolute left-1/4 top-1/3 w-6 h-6 bg-yellow-400 rounded-full opacity-75" />
                <div className="animate-ping absolute left-2/3 top-1/4 w-4 h-4 bg-pink-400 rounded-full opacity-75" />
                <div className="animate-ping absolute left-1/2 top-2/3 w-5 h-5 bg-purple-400 rounded-full opacity-75" />
              </div>
            )}
            <div className={`space-y-4 text-center ${confetti ? 'animate-pulse' : ''}`}>
              <div className={`text-6xl ${confetti ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : ''}`}>
                {gameStatus === "draw"
                  ? "🤝"
                  : winner && user && winner === user.id
                    ? "👑"
                    : "😔"}
              </div>
              <div>
                <p className={`text-xl font-extrabold ${confetti ? 'text-yellow-300' : 'text-yellow-200'}`}>+{getCoinsEarned()} Coins Earned!</p>
                <p className={`text-sm mt-1 ${confetti ? 'text-white' : 'text-gray-300'}`}>
                  {gameStatus === "draw"
                    ? "Good game!"
                    : winner && user && winner === user.id
                      ? "Excellent victory!"
                      : "Better luck next time!"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResultAction("playAgain")}
                  className={`flex-1 ${confetti ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => handleResultAction("exit")}
                  variant="outline"
                  className="flex-1 border-gray-600 text-white hover:bg-white/10"
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejoin Modal */}
      <Dialog open={showRejoinModal} onOpenChange={() => {}}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Connection Lost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="text-4xl">📡</div>
            <div>
              <p className="text-gray-300">Waiting for player to reconnect...</p>
              <p className="text-yellow-300 font-bold text-xl">{rejoinTimer}s</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((30 - rejoinTimer) / 30) * 100}%` }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BaseGameLayout




