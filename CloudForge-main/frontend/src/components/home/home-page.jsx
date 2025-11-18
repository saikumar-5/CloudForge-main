"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { ConnectionStatus } from "../realtime/connection-status"
import { GameModal } from "../game/game-modal"
import { Users, Clock } from "lucide-react"

export const HomePage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedGame, setSelectedGame] = useState(null)
  const [showGameModal, setShowGameModal] = useState(false)

  // Debug: Log user state
  console.log('HomePage - User state:', user)

  // handleGameStart is defined below

  const handleGameModalClose = () => {
    setShowGameModal(false)
    setSelectedGame(null)
  }

  const games = [
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      description: "Classic 3x3 grid game",
      minPlayers: 2,
      maxPlayers: 2,
      icon: "⭕",
      color: "from-red-500 to-pink-500",
      duration: "5-10 min"
    },
    {
      id: "connect4",
      name: "Connect 4",
      description: "Connect four in a row",
      minPlayers: 2,
      maxPlayers: 2,
      icon: "🔴",
      color: "from-yellow-500 to-orange-500",
      duration: "10-15 min"
    },
    {
      id: "tambola",
      name: "Tambola",
      description: "Number calling game",
      minPlayers: 2,
      maxPlayers: 8,
      icon: "🎱",
      color: "from-blue-500 to-cyan-500",
      duration: "20-45 min"
    },
  ]

  const handleGameClick = (game) => {
    setSelectedGame(game)
    setShowGameModal(true)
  }

  const handleGameStart = (gameMode, roomData) => {
    console.log('=== HOME PAGE GAME START ===')
    console.log('handleGameStart called with:', { gameMode, roomData })
    console.log('gameMode:', gameMode)
    console.log('roomData:', roomData)
    console.log('roomData.players:', roomData?.players)
    console.log('roomData.roomCode:', roomData?.roomCode)
    console.log('selectedGame:', selectedGame)
    console.log('Navigating to:', `/game/${selectedGame.id}`)
    console.log('Navigation state:', { gameMode, roomData, gameInfo: selectedGame })
    
    setShowGameModal(false)
    
    try {
      navigate(`/game/${selectedGame.id}`, {
        state: { gameMode, roomData, gameInfo: selectedGame },
        replace: false
      })
      console.log('Navigation successful')
      console.log('Current location after navigate:', window.location.pathname)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const handleProfileClick = () => {
    console.log('=== PROFILE CLICK DEBUG ===')
    console.log('handleProfileClick called')
    console.log('Current user:', user)
    console.log('Navigate function:', navigate)
    console.log('Attempting to navigate to /profile...')
    try {
      navigate("/profile")
      console.log('Navigate called successfully')
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  if (!user || !user.username) {
    console.log('HomePage - No user or missing username, showing loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold mb-2">Loading...</h2>
          <p className="text-blue-200">Please wait while we load your profile</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  console.log('HomePage - Rendering with user:', user.username, user.coins)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-2 xs:p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 xs:mb-5 sm:mb-6 md:mb-8">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4">
          <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
            <div className="text-2xl xs:text-3xl sm:text-4xl">🎮</div>
            <div>
              <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-white">CloudForge</h1>
              <p className="text-blue-200 text-xs xs:text-sm sm:text-base">Multiplayer Gaming Platform</p>
            </div>
          </div>

          {/* Profile & User Section - Responsive */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Direct Profile Button */}
            <Button 
              onClick={() => {
                console.log('Direct profile button clicked')
                handleProfileClick()
              }}
              variant="outline" 
              className="hidden sm:flex items-center gap-2 text-white hover:bg-white/10 border-white/20 px-3 py-2 text-sm"
            >
              <Users className="h-4 w-4" />
              Profile
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 xs:gap-2 text-white hover:bg-white/10 border border-white/20 px-2 py-1 xs:px-3 xs:py-2 text-xs xs:text-sm">
                  <Avatar className="h-6 w-6 xs:h-8 xs:w-8">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-xs xs:text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden xs:block">
                    <div className="font-medium text-xs xs:text-sm">{user.username}</div>
                    <div className="text-xs text-blue-200 hidden sm:block">{user.id}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-900/95 backdrop-blur-md border-blue-700 text-xs xs:text-sm">
                <DropdownMenuItem 
                  onClick={(e) => {
                    console.log('DropdownMenuItem clicked', e)
                    handleProfileClick()
                  }} 
                  className="text-white hover:bg-blue-600/20 cursor-pointer"
                  onSelect={(e) => {
                    console.log('DropdownMenuItem selected', e)
                    e.preventDefault()
                    handleProfileClick()
                  }}
                >
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-500/20 cursor-pointer">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="max-w-5xl mx-auto mt-2 sm:mt-4">
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Choose Your Game
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-blue-200 max-w-xl">
            Jump into a quick casual match or start a private room with your friends. More games are coming soon.
          </p>
        </div>

        {/* Games Grid - Modernized */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-700/60 shadow-[0_0_40px_rgba(15,23,42,0.8)] p-3 sm:p-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 sm:gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className="group relative bg-gradient-to-br from-white to-blue-50 backdrop-blur-md border-0 shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                onClick={() => handleGameClick(game)}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
                
                <CardContent className="relative p-4 xs:p-5 sm:p-6">
                  {/* Icon with modern styling */}
                  <div className={`relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl xs:text-3xl sm:text-4xl mb-3 xs:mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                    <div className="absolute inset-0 rounded-2xl bg-white/20 group-hover:bg-white/30 transition-all duration-300" />
                    <span className="relative">{game.icon}</span>
                  </div>
                  
                  {/* Game title */}
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {game.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4 line-clamp-2 min-h-[2.5rem]">
                    {game.description}
                  </p>
                  
                  {/* Game info badges */}
                  <div className="flex items-center gap-2 xs:gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 rounded-lg text-blue-700">
                      <Users className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span className="text-xs xs:text-sm font-semibold">{game.minPlayers}-{game.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 rounded-lg text-purple-700">
                      <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                      <span className="text-xs xs:text-sm font-semibold">{game.duration}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Game Modal */}
      <GameModal
        isOpen={showGameModal}
        onClose={handleGameModalClose}
        game={selectedGame}
        onStartGame={handleGameStart}
      />
    </div>
  )
}

