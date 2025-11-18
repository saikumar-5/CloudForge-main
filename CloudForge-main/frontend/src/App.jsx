import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/auth-context"
import { RealtimeProvider } from "./contexts/realtime-context"
import LoginPage from "./components/auth/login-page"
import { HomePage } from "./components/home/home-page"
import { ProfilePage } from "./components/profile/profile-page"
import { TicTacToePage } from "./components/games/tic-tac-toe-page"
import { Connect4Page } from "./components/games/connect4-page"
import { TambolaPage } from "./components/games/tambola-page"
import { Toaster } from "./components/ui/toaster"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-blue-950">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/game/tic-tac-toe" element={<TicTacToePage />} />
            <Route path="/game/connect4" element={<Connect4Page />} />
            <Route path="/game/tambola" element={<TambolaPage />} />
          </Routes>
          <Toaster />
        </div>
      </RealtimeProvider>
    </AuthProvider>
  )
}

export default App;

