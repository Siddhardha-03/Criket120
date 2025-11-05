const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');

// Validation middleware
const validateRegistration = [
  check('email').isEmail().withMessage('Please include a valid email'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain a letter'),
];

const validateLogin = [
  check('email').isEmail().withMessage('Please include a valid email'),
  check('password').exists().withMessage('Password is required'),
];

const validateForgotPassword = [
  check('email').isEmail().withMessage('Please include a valid email'),
];

const validateResetPassword = [
  check('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number')
    .matches(/[a-zA-Z]/)
    .withMessage('Password must contain a letter'),
];

// Public routes
router.post('/register', validate(validateRegistration), authController.register);
router.post('/login', validate(validateLogin), authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', validate(validateForgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(validateResetPassword), authController.resetPassword);

// Protected routes (require authentication)
// Example:
// router.get('/profile', authenticate, (req, res) => {
//   res.json({ user: req.user });
// });

module.exports = router;
