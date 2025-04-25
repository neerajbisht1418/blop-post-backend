// src/routes/auth.routes.js

const express = require('express');
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const authValidation = require('../validators/auth.validator');

const router = express.Router();

// Register route
router.post(
  '/register', 
  validate(authValidation.register), 
  authController.register
);

// Login route
router.post(
  '/login', 
  validate(authValidation.login), 
  authController.login
);

// Refresh token route
router.post(
  '/refresh-token', 
  validate(authValidation.refreshToken), 
  authController.refreshTokens
);

// Logout route
router.post(
  '/logout', 
  auth, 
  authController.logout
);

// Get current user route
router.get(
  '/me', 
  auth, 
  authController.getCurrentUser
);


// Get all user route
router.get(
  '/all', 
  auth, 
  authController.getAllUser
);


module.exports = router;