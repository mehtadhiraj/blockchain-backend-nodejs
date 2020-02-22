const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CryptoJs = require("crypto-js");
const stringify = require('json-stable-stringify');

module.exports.addAccount = function(req, res){
    try{
        // console.log(req.body);
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

// @initiateTransaction functions
async function setNextHash(transactionChain, hash){
    let lastTransaction = transactionChain.transactionChain[transactionChain.transactionChain.length - 1];
    let nextHash = hash;
    previousHash = lastTransaction.hash;
    lastTransaction.nextHash = nextHash;
    transactionChain.transactionChain[transactionChain.transactionChain.length - 1] = lastTransaction;
    transactionChain.markModified('transactionChain');
    await transactionChain.save();
    // console.log(transactionChain);   
    return previousHash; 
}

async function updateTransaction(hash, timeStamp, action, req, user, initiator){
    let transactionChain = await Transaction.findOne({ userId: initiator });
    let previousHash = transactionChain ? await setNextHash(transactionChain, hash) : "0";          
    let transaction = await Transaction.updateOne({ "userId": initiator }, 
        { 
            $push: { 
                transactionChain: {
                    sender: req.body.userId,
                    receiver: user._id,
                    amount: req.body.amount,
                    status: req.body.status,
                    timeStamp: timeStamp,
                    hash: hash,
                    action: action,
                    previousHash: previousHash
                } 
            } 
        },
        { upsert: true, runValidators: true });

    return transaction;
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
            let timeStamp = Date.now();
            let block = {
                sender: req.body.userId,
                receiver: user._id,
                amount: req.body.amount,
                timeStamp: timeStamp
            }  
            let hash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
            let senderTransaction = await updateTransaction(hash, timeStamp, 'sent', req, user, req.body.userId);
            let receiverTransaction = await updateTransaction(hash, timeStamp, 'received', req, user, user._id);
            // console.log({senderTransaction, receiverTransaction});
            if(senderTransaction && receiverTransaction){
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

module.exports.gettransaction = async function(req, res){
    try {
        // console.log(req.body);
        let transaction = await Transaction.findOne({ userId: req.body.userId }).populate('transactionChain.sender').populate('transactionChain.receiver');
        if(transaction){
            console.log(transaction.transactionChain);
            res.json({
                status: 202,
                transactionChain: transaction.transactionChain
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            status: 204,
            message: error.message
        })
    }
}