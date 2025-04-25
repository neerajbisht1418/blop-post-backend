const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const express = require('express');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',  // Example development origin
      'https://yourdomain.com'  // Example production origin
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Access-Control-Allow-Methods',  
    'Access-Control-Allow-Headers',  
    'Access-Control-Allow-Origin'    
  ]
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' })); 
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

app.use('/api', routes);
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Resource not found: ${req.originalUrl}`
  });
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;