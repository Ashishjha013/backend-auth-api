import Joi from 'joi';
import BaseDto from '../../../common/dto/base.dto.js';

class RegisterDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string()
      .trim()
      .min(8)
      .max(16)
      .message('Password must be between 8 and 16 characters')
      .required(),
    role: Joi.string().valid('customer', 'seller').default('customer'),
  });
}

export default RegisterDto;
