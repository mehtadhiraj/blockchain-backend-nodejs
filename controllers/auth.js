const jwt = require('jsonwebtoken');

module.exports.checkLogin = function(req, res, next){
    try {
        // console.log(req.headers);
        let token = req.headers.authorization.split(" ")[1];
        // console.log(token)
        jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, payload){
            // console.log('cl:', payload);
            if(payload){
                return next();
            }else{
                // console.log(err);
                return next({
                    status: 401,
                    message: "Session Expired. Please login again to continue."
                })
            }
        })   
    } catch (error) {
        return next({
            status: 401,
            message: "Please login first !!"
        })
    }
}

module.exports.checkUser = function(req, res, next){
    try {
        // console.log(req.body);
        let token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, payload){
            // console.log(payload, req.body);
            if(payload && payload._id === req.body.userId){
                return next();
            }else{
                return next({
                    status: 401,
                    message: "Unauthorized !!!"
                })
            }
        })   
    } catch (error) {
        return next({
            status: 401,
            message: "Unauthorized !!!"
        })
    }
}