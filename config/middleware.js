var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

module.exports = function initMiddleware(app){

    console.log("Initializing Middleware...");
    // view engine setup
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');

    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

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