const staticRoutes = require('./staticRoutes');
var createError = require('http-errors');

module.exports = function initRoutes(app){
    console.log('Initilaizing Routes...');
    app.use('/', staticRoutes);
    // app.use('/users', usersRouter);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        next(createError(404));
    });
    console.log("Routes Initialized :)");
}
