var express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const responseTime = require('response-time')

module.exports = function initMiddleware(app){

    console.log("Initializing Middleware...");
    // view engine setup
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(responseTime());
    app.use(cors());
    app.use(express.static(path.join(__dirname, '../public')));

    // error handler
    app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
    });

    console.log("Middleware Initialzed :)");
}