const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./logger");
const User = require("../models/User");

let io;
