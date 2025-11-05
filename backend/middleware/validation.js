const { validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().reduce((acc, err) => {
      acc[err.param] = err.msg;
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  };
};

// Custom validators
const isStrongPassword = (value) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(value)) {
    throw new Error('Password must be at least 8 characters long and contain at least one letter and one number');
  }
  return true;
};

const isEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    throw new Error('Please enter a valid email address');
  }
  return true;
};

module.exports = {
  validate,
  isStrongPassword,
  isEmail,
};
