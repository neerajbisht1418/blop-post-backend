const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { NODE_ENV } = require('../config/environment');

const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 
      (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  const { statusCode, message, isOperational, stack } = err;

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: statusCode === 500 && !isOperational 
      ? 'Internal server error' 
      : message,
    ...(NODE_ENV === 'development' && { stack }),
  });
};

module.exports = {
  errorConverter,
  errorHandler,
};