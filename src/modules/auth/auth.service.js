import crypto from 'crypto';
import User from './auth.model.js';
import ApiError from '../../common/utils/api-error.js';
import {
  signAccessToken,
  verifyRefreshToken,
  signRefreshToken,
  createPasswordResetToken,
} from '../../common/utils/jwt.utils.js';

// HASH TOKEN (SYNC, SIMPLE)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// REGISTER
export const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({ name, email, password, role });
  return user;
};

// LOGIN
export const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isVerified) {
    throw ApiError.unauthorized('Please verify your email before logging in');
  }

  const payload = { id: user._id, role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // store hashed refresh token
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

// REFRESH TOKEN
export const refresh = async (token) => {
  if (!token) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  const hashedIncoming = hashToken(token);

  if (user.refreshToken !== hashedIncoming) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const payload = { id: user._id, role: user.role };

  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  // rotate refresh token
  user.refreshToken = hashToken(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

// LOGOUT
export const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// FORGOT PASSWORD
export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw ApiError.notFound('User with this email does not exist');
  }

  const { rawToken, hashedToken } = createPasswordResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // TODO: send rawToken via email
  return rawToken;
};

// Get Me
export const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};
