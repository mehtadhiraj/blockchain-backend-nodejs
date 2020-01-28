const Account = require('../models/Account');

module.exports.addAccount = function(req, res){
    try{
        console.log(req.body);
        Account.create(req.body)
            .then(bankDetails => {
                res.json({
                    status: 200,
                    message: "Details added successfully.",
                    details: bankDetails
                })
            })
            .catch(error => {
                res.json({
                    error: error
                })
            })
    }catch(error){
        res.json({
            error: error
        })
    }
}

module.exports.getAccount = function(req, res){
    try{
        // console.log(req.body);
        Account.find({userId: req.body.userId}, (err, accounts)=>{
            if(err){
                res.json({
                    status: 204,
                    message: err
                })
            }else{
                res.json({
                    status: 200,
                    accounts: accounts
                })
            }
        })
    }catch(error) {
        res.json({
            error: error
        })
    }
}