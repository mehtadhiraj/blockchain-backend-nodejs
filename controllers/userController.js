const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CryptoJs = require("crypto-js");
const stringify = require('json-stable-stringify');

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

module.exports.initiateTransaction = async function(req, res){
    try{
        // console.log(req.body);
        let user = await User.findOne({ username: req.body.receiver });
        if(!user){
            res.json({
                status: 204,
                message: "Requested receiver does not exist"
            })
        }else{
            let transactionChain = await Transaction.findOne({ userId: req.body.userId });
            let timeStamp = Date.now();  
            let previousHash = '0';          
            if(transactionChain){
                let lastTransaction = transactionChain.transactionChain[transactionChain.transactionChain.length - 1];
                let block = {
                    sender: req.body.userId,
                    receiver: user._id,
                    amount: req.body.amount,
                    timeStamp: timeStamp    
                }
                let nextHash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
                block = {
                    sender: lastTransaction.sender,
                    receiver: lastTransaction.receiver,
                    amount: lastTransaction.amount,
                    timeStamp: lastTransaction.timeStamp
                }
                previousHash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
                lastTransaction.nextHash = nextHash;
                transactionChain.transactionChain[transactionChain.transactionChain.length - 1] = lastTransaction;
                transactionChain.markModified('transactionChain');
                await transactionChain.save();
                // console.log(transactionChain);    
            }
            let transaction = await Transaction.updateOne({"userId": req.body.userId}, 
                { 
                    $push: { 
                        transactionChain: {
                            sender: req.body.userId,
                            receiver: user._id,
                            amount: req.body.amount,
                            status: req.body.status,
                            timeStamp: timeStamp,
                            previousHash: previousHash
                        } 
                    } 
                },
                { upsert: true, runValidators: true });
            // console.log(transaction);
            if(transaction){
                res.json({
                    status: 200,
                    message: "Transaction Successfull."
                })
            } 
        }
    }catch(error){
        // console.log(error);
        res.json({
            status: 204,
            message: error.message
        })
    }
}