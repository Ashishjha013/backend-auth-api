import User from './auth.model.js';
import ApiError from '../../common/utils/api-error';
import { verifyAccessToken } from '../../common/utils/jwt.utils';

export const authenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not Authenticated');
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  req.user = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden("You don't have permission to access this resource");
    }
    next();
  };
};
