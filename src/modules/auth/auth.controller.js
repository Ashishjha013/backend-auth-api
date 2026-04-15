import * as authService from './auth.service.js';
import ApiResponse from '../../common/utils/api-response.js';

export const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiResponse.created(res, 'Registration successful', user);
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });

  ApiResponse.ok(res, 'Login successful', { user, accessToken, refreshToken });
};

export const logout = async (req, res) => {
  authService.logout(req.user.id);
  res.clearCookie('refreshToken');
  ApiResponse.ok(res, 'Logout successful');
};

export const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiResponse.ok(res, 'User profile fetched successfully', user);
};
