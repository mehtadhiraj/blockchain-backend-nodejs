var express = require('express');
require('dotenv').config();
var initMiddleware = require('./config/middleware');
var initRoutes = require('./routes/index');
var initDatabase = require('./config/database');
var app = express();

initDatabase();  //Initialize database
initMiddleware(app); // Initialize middleware
initRoutes(app); // initialize routes

module.exports = app;