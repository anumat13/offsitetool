const { createLogger, format, transports } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'error',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' })
  ],
});

module.exports = logger;
