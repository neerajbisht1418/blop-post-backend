const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { JWT_SECRET, JWT_REFRESH_EXPIRATION_DAYS, JWT_ACCESS_EXPIRATION_MINUTES } = require('../config/environment');

/**
 * Generate tokens (access and refresh)
 * @param {Object} user
 * @returns {Object}
 */
const generateTokens = (user) => {
  const accessTokenExpires = JWT_ACCESS_EXPIRATION_MINUTES
  const refreshTokenExpires = JWT_REFRESH_EXPIRATION_DAYS
  const secret = JWT_SECRET;

  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      type: tokenTypes.ACCESS,
    },
    secret,
    { expiresIn: accessTokenExpires }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id,
      type: tokenTypes.REFRESH,
    },
    secret,
    { expiresIn: refreshTokenExpires }
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

/**
 * Register a new user
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<User>}
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email already taken');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refresh.token;
    await user.save();

    // Remove password from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login with email and password
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<User>}
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    // Check if password matches
    const isPasswordMatch = await user.isPasswordMatch(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Save refresh token
    user.refreshToken = tokens.refresh.token;
    await user.save();

    // Remove password from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        user: userWithoutPassword,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh auth tokens
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    // Verify refresh token
    let tokenPayload;
    try {
      tokenPayload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Check if token type is refresh
    if (tokenPayload.type !== tokenTypes.REFRESH) {
      throw new ApiError(401, 'Invalid token type');
    }

    // Find user with refresh token
    const user = await User.findOne({
      _id: tokenPayload.userId,
      refreshToken,
    });

    if (!user) {
      throw new ApiError(401, 'User not found or token revoked');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    user.refreshToken = tokens.refresh.token;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
const logout = async (req, res, next) => {
  try {
    const { userId } = req.user;

    // Remove refresh token
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 * @param {Object} req
 * @param {Object} res
 * @returns {Promise<Object>}
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId).select('-password -refreshToken');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const users = await User.find({ _id: { $ne: userId } })
      .select('-password -refreshToken')
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        users,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  getCurrentUser,
  getAllUser
};