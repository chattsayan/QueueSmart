const winston = require("winston");
const path = require("path");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for log levels
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
  ),
);

// Define which transports logger must use
const transports = [
  // Console transport
  new winston.transports.Console(),

  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/error.log"),
    level: "error",
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),

  //   File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/combined.log"),
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json(),
    ),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format,
  transports,
  exitOnError: false, // Do not exit on handled exceptions
});

module.exports = logger;
