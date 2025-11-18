"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/auth-context"
import { useRealtime } from "../../contexts/realtime-context"
import BaseGameLayout from "./base-game-layout.jsx"

export function TambolaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { makeMove, registerEventHandler, gameState: realtimeGameState } = useRealtime()
  const { gameMode, roomData, gameInfo } = location.state || {}

  const [myTicket, setMyTicket] = useState(null)
  const [myClaims, setMyClaims] = useState({
    topLine: false,
    middleLine: false,
    bottomLine: false,
    fullHouse: false
  })
  const [gameStatus, setGameStatus] = useState("playing")

  const roomCode = roomData?.roomCode

  const currentNumber = realtimeGameState?.currentNumber || null
  const calledNumbers = realtimeGameState?.calledNumbers || []

  const prizes = useMemo(() => realtimeGameState?.prizes || {}, [realtimeGameState])

  // Find my player info and ticket whenever gameState changes
  useEffect(() => {
    if (!realtimeGameState || !user) return

    const players = realtimeGameState.players || []
    const me = players.find(p => p.userId === user.id || p.userId === user.uniqueId)

    if (me) {
      setMyTicket(me.ticket)
      setMyClaims(me.claims || {
        topLine: false,
        middleLine: false,
        bottomLine: false,
        fullHouse: false
      })
    }

    if (realtimeGameState.gameOver) {
      setGameStatus("finished")
    } else {
      setGameStatus("playing")
    }
  }, [realtimeGameState, user])

  // Listen for game over events explicitly (redundant but consistent with other games)
  useEffect(() => {
    const onGameStateUpdated = (data) => {
      if (data.gameState?.gameOver) {
        setGameStatus("finished")
      }
    }

    const onGameOver = (data) => {
      if (data.gameState?.gameOver) {
        setGameStatus("finished")
      }
    }

    registerEventHandler('onGameStateUpdated', onGameStateUpdated)
    registerEventHandler('onGameOver', onGameOver)

    return () => {
      // no-op cleanup (handler map is overwritten by new handlers)
    }
  }, [registerEventHandler])

  const handleGameEnd = (result) => {
    if (result === "exit") {
      navigate("/home")
    } else {
      // For multiplayer Tambola we don't locally reset; room/gameState resets on new match
      navigate("/home")
    }
  }

  const isHost = useMemo(() => {
    if (!roomData?.players || !user) return false
    const me = roomData.players.find(p => p.userId === (user.uniqueId || user.id))
    return !!me?.isHost
  }, [roomData, user])

  const handleCallNumber = () => {
    if (!roomCode) return
    try {
      makeMove(roomCode, { action: 'call' })
    } catch (error) {
      console.error('Error calling number:', error)
    }
  }

  const handleClaim = (prizeType) => {
    if (!roomCode) return
    try {
      makeMove(roomCode, { action: 'claim', prizeType })
    } catch (error) {
      console.error('Error claiming prize:', prizeType, error)
    }
  }

  const numbersLeft = useMemo(() => {
    if (!realtimeGameState) return 0
    return 90 - (realtimeGameState.calledNumbers?.length || 0)
  }, [realtimeGameState])

  const winnerUserId = realtimeGameState?.winner || null

  return (
    <BaseGameLayout
      gameInfo={gameInfo || { name: "Tambola", id: "tambola" }}
      gameMode={gameMode}
      roomData={roomData}
      gameStatus={gameStatus}
      winner={winnerUserId}
      onGameEnd={handleGameEnd}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Ticket Section */}
        <div className="flex-1 bg-gray-900/40 border border-yellow-500/30 rounded-xl p-4 shadow-xl">
          <h2 className="text-xl font-bold text-yellow-300 mb-3 text-center">Your Tambola Ticket</h2>

          {!myTicket && (
            <p className="text-center text-gray-400 text-sm">Waiting for ticket...</p>
          )}

          {myTicket && (
            <>
              <div className="grid grid-rows-3 gap-2">
                {myTicket.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-9 gap-1">
                    {row.map((num, colIndex) => {
                      const isCalled = num !== null && calledNumbers.includes(num)
                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`h-10 flex items-center justify-center rounded-md text-sm font-semibold border transition-all
                            ${num === null
                              ? "bg-gray-800/60 border-gray-700"
                              : isCalled
                                ? "bg-green-500/80 border-green-300 text-white shadow-lg"
                                : "bg-gray-700/80 border-gray-600 text-yellow-100"}
                          `}
                        >
                          {num || ""}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] text-center text-gray-200">
                <button
                  onClick={() => handleClaim('topLine')}
                  disabled={!!prizes.topLine || myClaims.topLine || gameStatus === 'finished'}
                  className={`py-1 px-2 rounded-full border transition-colors flex items-center justify-center gap-1 ${
                    myClaims.topLine
                      ? 'bg-green-600/70 border-green-300 text-white'
                      : prizes.topLine && prizes.topLine !== (user?.id || user?.uniqueId)
                        ? 'bg-gray-800/70 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800/70 border-gray-600 hover:bg-gray-700/80'
                  }`}
                >
                  <span>Top Line</span>
                  {myClaims.topLine && <span>✅</span>}
                </button>

                <button
                  onClick={() => handleClaim('middleLine')}
                  disabled={!!prizes.middleLine || myClaims.middleLine || gameStatus === 'finished'}
                  className={`py-1 px-2 rounded-full border transition-colors flex items-center justify-center gap-1 ${
                    myClaims.middleLine
                      ? 'bg-green-600/70 border-green-300 text-white'
                      : prizes.middleLine && prizes.middleLine !== (user?.id || user?.uniqueId)
                        ? 'bg-gray-800/70 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800/70 border-gray-600 hover:bg-gray-700/80'
                  }`}
                >
                  <span>Middle Line</span>
                  {myClaims.middleLine && <span>✅</span>}
                </button>

                <button
                  onClick={() => handleClaim('bottomLine')}
                  disabled={!!prizes.bottomLine || myClaims.bottomLine || gameStatus === 'finished'}
                  className={`py-1 px-2 rounded-full border transition-colors flex items-center justify-center gap-1 ${
                    myClaims.bottomLine
                      ? 'bg-green-600/70 border-green-300 text-white'
                      : prizes.bottomLine && prizes.bottomLine !== (user?.id || user?.uniqueId)
                        ? 'bg-gray-800/70 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-800/70 border-gray-600 hover:bg-gray-700/80'
                  }`}
                >
                  <span>Bottom Line</span>
                  {myClaims.bottomLine && <span>✅</span>}
                </button>

                <button
                  onClick={() => handleClaim('fullHouse')}
                  disabled={!!prizes.fullHouse || myClaims.fullHouse || gameStatus === 'finished'}
                  className={`py-1 px-2 rounded-full border transition-colors flex items-center justify-center gap-1 ${
                    myClaims.fullHouse
                      ? 'bg-purple-700/80 border-purple-300 text-white'
                      : prizes.fullHouse && prizes.fullHouse !== (user?.id || user?.uniqueId)
                        ? 'bg-gray-800/70 border-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-700/40 border-purple-400/60 hover:bg-purple-700/60'
                  }`}
                >
                  <span>Full House</span>
                  {myClaims.fullHouse && <span>👑</span>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Caller & History Section */}
        <div className="w-full lg:w-80 bg-gray-900/60 border border-blue-500/40 rounded-xl p-4 flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-blue-300 mb-1">Number Caller</h2>
            <p className="text-xs text-gray-300">Only the host can call the next number</p>
          </div>

          <div className="bg-gray-800/70 rounded-lg p-4 flex flex-col items-center gap-2">
            <div className="text-xs text-gray-300">Current Number</div>
            <div className="text-4xl font-extrabold text-yellow-300 drop-shadow">{currentNumber || "-"}</div>
            <div className="text-xs text-gray-400">Remaining: {numbersLeft}</div>

            <div className="flex gap-2 mt-2 w-full">
              <button
                onClick={handleCallNumber}
                disabled={!isHost || gameStatus === 'finished' || numbersLeft === 0}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  !isHost || gameStatus === 'finished' || numbersLeft === 0
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isHost ? 'Call Next Number' : 'Waiting for Host'}
              </button>
            </div>

            {gameStatus === "finished" && winnerUserId && (
              <div className="mt-2 text-center text-green-400 text-sm font-semibold">
                Full House Winner: {winnerUserId === (user?.id || user?.uniqueId) ? 'You 🎉' : winnerUserId}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-xs font-semibold text-gray-300 mb-2">Called Numbers</h3>
            <div className="h-40 overflow-y-auto bg-gray-800/60 rounded-lg p-2 text-xs grid grid-cols-10 gap-1">
              {calledNumbers.map((n) => (
                <div
                  key={n}
                  className="h-6 flex items-center justify-center rounded bg-blue-600/80 text-white font-semibold"
                >
                  {n}
                </div>
              ))}
              {!calledNumbers.length && (
                <p className="col-span-10 text-center text-gray-400 mt-4">No numbers called yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </BaseGameLayout>
  )
}
