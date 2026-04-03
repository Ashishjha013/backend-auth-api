import ApiError from '../../common/utils/api-error.js';
import User from './auth.model.js';

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }
  const 
  return userObj;
};

export { register };
