const Account         = require('../models/Account');
const Transaction     = require('../models/Transaction');
const User            = require('../models/User');
const transaction     = require('./transactionFunctions');
const CryptoJs        = require("crypto-js");
const stringify       = require('json-stable-stringify');
const firebase        = require('../config/firebase');

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
            // console.log(user);
            let timeStamp = Date.now();
            let block = {
                sender: req.body.userId,
                receiver: user['_id'].toString(),
                amount: req.body.amount,
                timeStamp: timeStamp
            }  
            // console.log(block);
            let hash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
            let senderTransaction = await transaction.addTransaction(hash, 'sent', req, user, req.body.userId);
            let receiverTransaction = await transaction.addTransaction(hash, 'received', req, user, user._id);
            // console.log(senderTransaction, receiverTransaction);
            if(senderTransaction && receiverTransaction){
                let senderTransactionId = senderTransaction.transactionChain[senderTransaction.transactionChain.length - 1]._id.toString();
                let receiverTransactionId = receiverTransaction.transactionChain[receiverTransaction.transactionChain.length - 1]._id.toString();
                let minnerData = {
                    senderTransactionId: senderTransactionId,
                    receiverTransactionId: receiverTransactionId,
                    hash: hash,
                    nonce: []
                }
                // console.log(minnerData);
                let ref = firebase.ref('/transactions/'+senderTransactionId+'-'+receiverTransactionId);
                ref.set(minnerData);
                setTimeout(async ()=>{
                    await ref.once('value', async function(snapshot){
                        // console.log(snapshot.val());
                        let nonceJson = snapshot.val().nonce;
                        if(!nonceJson){
                            ref.remove();
                            let status = 'fail';
                            let nonce = -1;
                            await transaction.updateTransaction(senderTransactionId, status, nonce);
                            await transaction.updateTransaction(receiverTransactionId, status, nonce);
                        }else{
                            let nonceKeys = Object.keys(nonceJson);
                            let nonceArray = nonceKeys.map(key => {
                                return nonceJson[key];
                            })
                            // console.log(nonceArray);
                            console.log("Validating Transactions...");
                            await transaction.validateTransaction(nonceArray, senderTransactionId, receiverTransactionId);
                            console.log("Transaction Validated.");
                        }
                    });
                    ref.remove();
                }, 30000)
                res.json({
                    status: 200,
                    message: "Transaction In Process."
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
            // console.log(transaction.transactionChain);
            res.json({
                status: 202,
                transactionChain: transaction.transactionChain
            })
        }
    } catch (error) {
        // console.log(error);
        res.json({
            status: 204,
            message: error.message
        })
    }
}