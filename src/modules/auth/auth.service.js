import User from './auth.model.js';
import ApiError from '../../common/utils/api-error.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyRefreshToken,
} from '../../common/utils/jwt.utils.js';

// Hashing the refresh token before storing it in the database adds an extra layer of security. Even if the database is compromised, attackers won't have access to the actual refresh tokens, making it harder for them to use stolen tokens to gain unauthorized access.
const hashToken = async (token) => {
  crypto.createHash('sha256').update(token).digest('hex');
};

// Registration flow: User submits registration data, server checks if email is unique, hashes password, creates user record, and optionally sends verification email.
const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }

  const user = await User.create({ name, email, password, role });
  // Optionally, send verification email here
  return user;
};

// Login flow: User submits email and password, server verifies credentials, checks if email is verified, and if valid, issues access and refresh tokens.
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isVerfied) {
    throw ApiError.unauthorized('Please verify your email before logging in');
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return { user: userObj, accessToken, refreshToken };
};

// Refresh token flow: Client sends refresh token to get new access token. Server verifies refresh token, checks if it matches the one stored for the user, and if valid, issues a new access token and refresh token.
const refresh = async (token) => {
  if (!token) {
    throw ApiError.unauthorized('Refresh token is required');
  }
  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (!user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken };
};

//
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// Forgot password flow: User submits email, server checks if user exists, generates a reset token, saves it to the user's record with an expiration time, and sends an email with the reset link containing the token.
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw ApiError.notFound('User with this email does not exist');
  }

  const { rawToken, hashedToken } = generateResetToken();
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();
};

export { register, login, refresh, logout, forgotPassword };
