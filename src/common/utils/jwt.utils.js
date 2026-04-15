import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ACCESS TOKEN
export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// REFRESH TOKEN
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// PASSWORD RESET TOKEN
export const createPasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  return { rawToken, hashedToken };
};
