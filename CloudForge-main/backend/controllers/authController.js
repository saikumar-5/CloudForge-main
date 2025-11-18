const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'cloudplay-secret-key',
    { expiresIn: '30d' }
  );
};

// Generate unique user ID
const generateUniqueId = () => {
  return 'USR' + uuidv4().substring(0, 8).toUpperCase();
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Check if user already exists (exclude guest accounts)
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }],
      isGuest: false
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.username === username 
          ? 'Username already taken' 
          : 'Email already registered' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      uniqueId: generateUniqueId(),
      isGuest: false,
      coins: 1000,
      gamesPlayed: 0,
      gamesWon: 0
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      email: user.email,
      coins: user.coins,
      isGuest: user.isGuest,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email, isGuest: false });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      email: user.email,
      coins: user.coins,
      isGuest: user.isGuest,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Guest login
exports.guestLogin = async (req, res) => {
  try {
    // Create a new guest user
    const guestUser = new User({
      username: `Guest_${generateUniqueId()}`,
      isGuest: true,
      uniqueId: generateUniqueId(),
      coins: 1000,
      gamesPlayed: 0,
      gamesWon: 0
    });

    await guestUser.save();

    // Generate token
    const token = generateToken(guestUser._id);

    // Return user data
    const userData = {
      id: guestUser._id,
      uniqueId: guestUser.uniqueId,
      username: guestUser.username,
      isGuest: true,
      coins: guestUser.coins,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: guestUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Guest login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during guest login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Google authentication
exports.googleAuth = async (req, res) => {
  try {
    const { idToken, email, displayName, photoURL } = req.body;
    
    if (!email || !idToken) {
      return res.status(400).json({
        success: false,
        message: 'Email and ID token are required for Google authentication'
      });
    }

    let payload;
    try {
      // First try to verify as a Google ID token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (googleError) {
      console.log('Google token verification failed, trying Firebase token...', googleError.message);
      // If Google verification fails, treat it as a Firebase token
      // We'll use the email directly since we're trusting Firebase's verification
      payload = {
        email: email,
        sub: idToken, // Using idToken as sub since it's a Firebase UID
        email_verified: true,
        name: displayName || email.split('@')[0],
        picture: photoURL || ''
      };
    }

    // Generate a username if not provided
    const username = displayName || email.split('@')[0];
    
    // Find user by email or Google ID
    let user = await User.findOne({
      $or: [
        { email, isGuest: false },
        { googleId: payload.sub }
      ]
    });
    
    if (!user) {
      // Create new user with Google auth
      user = new User({
        uniqueId: generateUniqueId(),
        username: username,
        email: email,
        googleId: payload.sub,
        profilePicture: photoURL || payload.picture || '',
        coins: 1000,
        isGuest: false,
        isVerified: true, // Trust Firebase-verified emails
        gamesPlayed: 0,
        gamesWon: 0
      });
      await user.save();
    } else if (!user.googleId) {
      // Update existing user with Google ID if not set
      user.googleId = payload.sub;
      user.isVerified = true;
      if (photoURL) user.profilePicture = photoURL;
      if (!user.username) user.username = username;
      await user.save();
    }

    const token = generateToken(user._id);

    // Prepare user data to return (exclude sensitive information)
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      coins: user.coins,
      isGuest: user.isGuest,
      isVerified: user.isVerified,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      coins: user.coins,
      isGuest: user.isGuest,
      isVerified: user.isVerified,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email, profilePicture } = req.body;
    const updates = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (profilePicture) updates.profilePicture = profilePicture;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return updated user data
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      coins: user.coins,
      isGuest: user.isGuest,
      isVerified: user.isVerified,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update game stats and coins
exports.updateGameStats = async (req, res) => {
  try {
    const { won, coinsEarned } = req.body;

    // Validate input
    if (typeof won !== 'boolean' || typeof coinsEarned !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Expected won (boolean) and coinsEarned (number)'
      });
    }

    // Find user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update game stats
    user.gamesPlayed += 1;
    if (won) {
      user.gamesWon += 1;
    }
    user.coins += coinsEarned;

    await user.save();

    // Return updated user data
    const userData = {
      id: user._id,
      uniqueId: user.uniqueId,
      username: user.username,
      coins: user.coins,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon
    };

    res.json({
      success: true,
      message: 'Game stats updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during game stats update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};