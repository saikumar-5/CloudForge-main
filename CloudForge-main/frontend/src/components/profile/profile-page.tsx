"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Coins,
  Trophy,
  Calendar,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Target,
  Gamepad2,
  Award,
  TrendingUp,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProfilePageProps {
  onBack: () => void
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, logout } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editedUsername, setEditedUsername] = useState(user?.username || "")

  if (!user) return null

  // Mock game statistics
  const gameStats = {
    totalGames: 47,
    gamesWon: 23,
    gamesLost: 24,
    winRate: Math.round((23 / 47) * 100),
    favoriteGame: "Tic Tac Toe",
    totalCoinsEarned: 2350,
    currentStreak: 3,
    bestStreak: 7,
    achievements: [
      { name: "First Win", description: "Won your first game", earned: true },
      { name: "Coin Collector", description: "Earned 1000+ coins", earned: true },
      { name: "Streak Master", description: "Win 5 games in a row", earned: true },
      { name: "Social Player", description: "Play 50+ games", earned: false },
      { name: "Champion", description: "Win 100+ games", earned: false },
    ],
  }

  const handleSaveProfile = () => {
    if (editedUsername.trim().length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      })
      return
    }

    // Here you would typically update the user profile via API
    setIsEditing(false)
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated",
    })
  }

  const handleCancelEdit = () => {
    setEditedUsername(user.username)
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Profile Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={editedUsername}
                        onChange={(e) => setEditedUsername(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <CardTitle className="text-white">{user.username}</CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white/60 hover:text-white"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-white/60 text-sm">ID: {user.uniqueId}</p>
                    {user.isGuest && (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                        Guest Account
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-medium">Current Coins</span>
                  </div>
                  <span className="text-yellow-400 font-bold text-lg">{user.coins}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Member since today</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{user.isGuest ? "Guest Player" : "Registered Player"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.isGuest && (
                  <Button className="w-full bg-transparent" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Create Account
                  </Button>
                )}
                <Button className="w-full bg-transparent" variant="outline" onClick={logout}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Statistics */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Game Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-white">{gameStats.totalGames}</div>
                    <div className="text-sm text-white/60">Total Games</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{gameStats.gamesWon}</div>
                    <div className="text-sm text-white/60">Games Won</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">{gameStats.gamesLost}</div>
                    <div className="text-sm text-white/60">Games Lost</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{gameStats.winRate}%</div>
                    <div className="text-sm text-white/60">Win Rate</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>Win Rate Progress</span>
                      <span>{gameStats.winRate}%</span>
                    </div>
                    <Progress value={gameStats.winRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 text-white/80 mb-1">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">Favorite Game</span>
                      </div>
                      <div className="text-white font-medium">{gameStats.favoriteGame}</div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 text-white/80 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Current Streak</span>
                      </div>
                      <div className="text-white font-medium">{gameStats.currentStreak} wins</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameStats.achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        achievement.earned
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      <div className={`p-2 rounded-full ${achievement.earned ? "bg-green-500" : "bg-white/20"}`}>
                        <Trophy className={`h-4 w-4 ${achievement.earned ? "text-white" : "text-white/40"}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${achievement.earned ? "text-white" : "text-white/60"}`}>
                          {achievement.name}
                        </div>
                        <div className="text-sm text-white/60">{achievement.description}</div>
                      </div>
                      {achievement.earned && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-200">
                          Earned
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { game: "Tic Tac Toe", result: "Won", coins: "+50", time: "2 hours ago" },
                    { game: "Connect 4", result: "Lost", coins: "0", time: "4 hours ago" },
                    { game: "Ludo", result: "Won", coins: "+100", time: "1 day ago" },
                    { game: "Tambola", result: "Won", coins: "+150", time: "2 days ago" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.result === "Won" ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                        <div>
                          <div className="text-white font-medium">{activity.game}</div>
                          <div className="text-sm text-white/60">{activity.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${activity.result === "Won" ? "text-green-400" : "text-red-400"}`}>
                          {activity.result}
                        </div>
                        {activity.coins !== "0" && <div className="text-sm text-yellow-400">{activity.coins}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
