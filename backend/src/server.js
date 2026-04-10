const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const hpp = require("hpp");

// load environment variables
require("dotenv").config();

// initialize express app
const app = express();

// Connect to the database
connectDB();

// Trust proxy
app.set("trust proxy", 1);

// security middleware
app.use(helmet());

// CORS configuration
