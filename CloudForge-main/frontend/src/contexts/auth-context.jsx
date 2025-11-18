"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"
import { 
  signInWithPopup, 
  GoogleAuthProvider
} from "firebase/auth"
import { auth } from "../firebase"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const googleProvider = new GoogleAuthProvider()
  
  // Set custom parameters for Google Auth
  googleProvider.setCustomParameters({
    prompt: 'select_account' // Forces account selection even for one account
  })

  // Function to update user profile
  const updateProfile = async (profileData) => {
    try {
      // In a real app, you would make an API call to update the profile
      // For now, we'll just update the local state
      const updatedUser = { 
        ...user, 
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      // Update the appropriate storage based on user type
      if (user?.isGuest) {
        sessionStorage.setItem("guestUser", JSON.stringify(updatedUser));
      } else {
        localStorage.setItem("gameUser", JSON.stringify(updatedUser));
      }
      
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Check for existing user session
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem("gameUser");
        const guestUser = sessionStorage.getItem("guestUser");

        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          // Ensure required fields have defaults
          setUser({
            id: parsedUser.id || 'user_' + Math.random().toString(36).substr(2, 9),
            username: parsedUser.username || 'User',
            email: parsedUser.email || '',
            isGuest: false,
            token: parsedUser.token || '',
            coins: parsedUser.coins || 0,
            gamesPlayed: parsedUser.gamesPlayed || 0,
            gamesWon: parsedUser.gamesWon || 0,
            createdAt: parsedUser.createdAt || new Date().toISOString(),
            updatedAt: parsedUser.updatedAt || new Date().toISOString(),
            ...parsedUser
          });
        } else if (guestUser) {
          const parsedGuest = JSON.parse(guestUser);
          setUser({
            id: parsedGuest.id || 'guest_' + Math.random().toString(36).substr(2, 9),
            username: parsedGuest.username || 'Guest',
            email: parsedGuest.email || '',
            isGuest: true,
            coins: parsedGuest.coins || 0,
            gamesPlayed: parsedGuest.gamesPlayed || 0,
            gamesWon: parsedGuest.gamesWon || 0,
            createdAt: parsedGuest.createdAt || new Date().toISOString(),
            updatedAt: parsedGuest.updatedAt || new Date().toISOString(),
            ...parsedGuest
          });
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Create a default guest user if there's an error
        const defaultGuest = {
          id: 'guest_' + Math.random().toString(36).substr(2, 9),
          username: 'Guest',
          email: '',
          isGuest: true,
          coins: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        sessionStorage.setItem("guestUser", JSON.stringify(defaultGuest));
        setUser(defaultGuest);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [])

  const generateUniqueId = () => {
    return "USR" + Math.random().toString(36).substr(2, 9).toUpperCase()
  }

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { token, user: userData } = response.data;

      // Store token
      localStorage.setItem("authToken", token);
      
      // Format user data
      const formattedUser = {
        id: userData.uniqueId,
        username: userData.username,
        email: userData.email,
        coins: userData.coins,
        isGuest: userData.isGuest,
        gamesPlayed: userData.gamesPlayed,
        gamesWon: userData.gamesWon,
        token: token,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt || userData.createdAt
      };

      setUser(formattedUser);
      localStorage.setItem("gameUser", JSON.stringify(formattedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  const signup = async (username, email, password) => {
    try {
      console.log('Attempting signup...', { username, email });
      const response = await authAPI.register(username, email, password);
      console.log('Signup response:', response.data);
      
      const { token, user: userData } = response.data;

      // Store token
      localStorage.setItem("authToken", token);
      
      // Format user data
      const formattedUser = {
        id: userData.uniqueId,
        username: userData.username,
        email: userData.email,
        coins: userData.coins,
        isGuest: userData.isGuest,
        gamesPlayed: userData.gamesPlayed,
        gamesWon: userData.gamesWon,
        token: token,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt || userData.createdAt
      };

      setUser(formattedUser);
      localStorage.setItem("gameUser", JSON.stringify(formattedUser));
      
      console.log('Signup successful:', formattedUser);
      return { success: true };
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Signup failed');
    }
  }

  const loginAsGuest = async () => {
    try {
      console.log('Attempting guest login...');
      const response = await authAPI.guestLogin();
      console.log('Guest login response:', response.data);
      
      const { token, user: userData } = response.data;

      // Store token
      localStorage.setItem("authToken", token);
      
      // Format user data
      const formattedUser = {
        id: userData.uniqueId,
        username: userData.username,
        email: userData.email,
        coins: userData.coins,
        isGuest: userData.isGuest,
        gamesPlayed: userData.gamesPlayed,
        gamesWon: userData.gamesWon,
        token: token,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt || userData.createdAt
      };

      setUser(formattedUser);
      sessionStorage.setItem("guestUser", JSON.stringify(formattedUser));
      
      console.log('Guest login successful:', formattedUser);
      return { success: true };
    } catch (error) {
      console.error('Guest login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Guest login failed');
    }
  }

  const signInWithGoogle = async () => {
    try {
      // Sign in with Firebase Google Auth
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the ID token from Firebase
      const idToken = await user.getIdToken();
      
      // Prepare user data to send to backend
      const userData = {
        idToken,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      
      // Send the token to backend for verification and user creation/login
      const response = await authAPI.googleAuth(userData);
      const { token, user: userDataFromBackend } = response.data;

      // Store token
      localStorage.setItem("authToken", token);
      
      // Format user data for frontend
      const formattedUser = {
        id: userDataFromBackend.uniqueId || user.uid,
        username: userDataFromBackend.username || user.displayName || user.email.split('@')[0],
        email: userDataFromBackend.email || user.email,
        profilePicture: userDataFromBackend.profilePicture || user.photoURL || '',
        coins: userDataFromBackend.coins || 1000,
        isGuest: false,
        isVerified: true,
        gamesPlayed: userDataFromBackend.gamesPlayed || 0,
        gamesWon: userDataFromBackend.gamesWon || 0,
        token: token,
        createdAt: userDataFromBackend.createdAt || new Date().toISOString(),
        updatedAt: userDataFromBackend.updatedAt || new Date().toISOString(),
        googleId: user.uid
      };

      setUser(formattedUser);
      localStorage.setItem("gameUser", JSON.stringify(formattedUser));
      
      return { success: true, user: formattedUser };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Google sign in failed');
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("gameUser")
    localStorage.removeItem("authToken")
    sessionStorage.removeItem("guestUser")
  }

  const updateCoins = async (amount) => {
    if (user) {
      const updatedUser = { ...user, coins: user.coins + amount }
      setUser(updatedUser)

      // Update local storage immediately for UI responsiveness
      if (user.isGuest) {
        sessionStorage.setItem("guestUser", JSON.stringify(updatedUser))
      } else {
        localStorage.setItem("gameUser", JSON.stringify(updatedUser))
      }

      // For registered users, also update the backend
      if (!user.isGuest) {
        try {
          await authAPI.updateGameStats(false, amount)
        } catch (error) {
          console.error('Failed to update coins on backend:', error)
          // Don't revert local state on error to maintain good UX
        }
      }
    }
  }

  const updateGameStats = async (won, coinsEarned = 0) => {
    if (user) {
      const updatedUser = {
        ...user,
        gamesPlayed: user.gamesPlayed + 1,
        gamesWon: won ? user.gamesWon + 1 : user.gamesWon,
        coins: user.coins + coinsEarned,
      }
      setUser(updatedUser)

      // Update local storage immediately for UI responsiveness
      if (user.isGuest) {
        sessionStorage.setItem("guestUser", JSON.stringify(updatedUser))
      } else {
        localStorage.setItem("gameUser", JSON.stringify(updatedUser))
      }

      // For registered users, also update the backend
      if (!user.isGuest) {
        try {
          await authAPI.updateGameStats(won, coinsEarned)
        } catch (error) {
          console.error('Failed to update game stats on backend:', error)
          // Don't revert local state on error to maintain good UX
        }
      }
    }
  }

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    loginAsGuest,
    updateCoins,
    updateGameStats,
    signInWithGoogle,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider;

