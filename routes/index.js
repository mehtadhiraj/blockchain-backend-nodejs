const staticRoutes = require('./staticRoutes');
const userRoutes = require('./userRoutes');
var createError = require('http-errors');

module.exports = function initRoutes(app){
    console.log('Initilaizing Routes...');
    app.use('/', staticRoutes);
    app.use('/user', userRoutes);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        next(createError(404));
    });
    console.log("Routes Initialized :)");
}
