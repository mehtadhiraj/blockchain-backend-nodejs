const jwt = require('jsonwebtoken');
const User = require('../models/User');
const randomWords = require('random-words');

module.exports.home = function(req, res){
    try {
        res.json({
            status : 202,
            message : "Welcome to new method of payment."
        })    
    } catch (error) {
        res.json({
            error : error
        })
    }
    
}

module.exports.login = function(req, res){
    try {
        // console.log(req.body);
        User.findOne({username: req.body.username}, (userError, user)=>{
            if(user){
                user.comparePassword(req.body.password, function(pswdError, isMatch){
                    if(isMatch){
                        let userDetails = {
                            _id: user._id,
                            username: user.username,
                            name: user.name
                        }
                        jwt.sign(userDetails, process.env.JWT_SECRET_KEY, {expiresIn: '1h'}, function(tokenError, token){
                            if(tokenError){
                                res.status(403).json({
                                    message: "Something went wrong. Please try again."
                                })                   
                            }else{
                                res.json({
                                    status: 202,
                                    message: "Logged in successfully.",
                                    token,
                                    user: userDetails
                                })
                            }
                        })
                    }else{
                        res.json({
                            status: 204,
                            error: pswdError,
                            message: "Invalid Credentials."
                        })
                    }
                })
            }else{
                res.json({
                    status: 204,
                    error: userError,
                    message: "User does not exist."
                })
            }
        });    
    } catch (error) {
        res.json({
            error: error
        })
    }
}

module.exports.register = function(req, res){
    try {
        let wordsArray = randomWords({exactly: 11});
        let timeStamp = Date.now().toString();
        wordsArray.push(timeStamp);
        console.log({ wordsArray, timeStamp });
        console.log(wordsArray.join("-"));
        let user = {
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            privateKey: wordsArray.join("-")
        }
        User.create(user)
            .then(user => {
                // console.log(user);
                let clientUserData = {
                    name: user.name,
                    _id: user._id,
                    username: user.username
                }
                jwt.sign(clientUserData, process.env.JWT_SECRET_KEY, {expiresIn: '1h'}, (tokenError, token)=> {
                    if(tokenError){
                        // console.log(tokenError);
                        res.json({
                            status: 204,
                            error: tokenError
                        })
                    }else{
                        res.json({
                            message: "Successfully registered",
                            user: clientUserData,
                            token,
                            privateKey: wordsArray
                        })
                    }
                })
            })
            .catch(err => {
                // console.log(err);
                res.json({
                    status: 204,
                    error: err
                })      
            })
          
    } catch (error) {
        // console.log(error);
        res.json({
            status: 404,
            error: error
        })
    }
}
