const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const { JWT_SECRET, JWT_REFRESH_EXPIRATION_DAYS, JWT_ACCESS_EXPIRATION_MINUTES } = require('../config/environment');

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

const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email already taken');
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refresh.token;
    await user.save();

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

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Incorrect email or password');
    }
    const isPasswordMatch = await user.isPasswordMatch(password);
    if (!isPasswordMatch) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    const tokens = generateTokens(user);

    user.refreshToken = tokens.refresh.token;
    await user.save();

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

const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }

    let tokenPayload;
    try {
      tokenPayload = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (tokenPayload.type !== tokenTypes.REFRESH) {
      throw new ApiError(401, 'Invalid token type');
    }

    const user = await User.findOne({
      _id: tokenPayload.userId,
      refreshToken,
    });

    if (!user) {
      throw new ApiError(401, 'User not found or token revoked');
    }

    const tokens = generateTokens(user);

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

const logout = async (req, res, next) => {
  try {
    const { userId } = req.user;

    await User.findByIdAndUpdate(userId, { refreshToken: null });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

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