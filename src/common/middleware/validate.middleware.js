import ApiError from '../utils/api-error';

const validate = (Dtoclass) => {
  return (req, res, next) => {
    const { errors, value } = Dtoclass.validate(req.body);
    if (errors) {
      throw ApiError.badRequest(errors.join('; '));
    }
    req.body = value; // Use the validated and sanitized data
    next();
  };
};

export default validate;
