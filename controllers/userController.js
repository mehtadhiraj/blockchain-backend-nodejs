const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CryptoJs = require("crypto-js");
const stringify = require('json-stable-stringify');
const firebase = require('../config/firebase');

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
async function getPreviousHash(transactionChain){
    let lastTransaction = transactionChain.transactionChain[transactionChain.transactionChain.length - 1];
    previousHash = lastTransaction.hash;
    return previousHash; 
}

async function addTransaction(hash, action, req, user, initiator){
    let transactionChain = await Transaction.findOne({ userId: initiator });
    let previousHash = transactionChain ? await getPreviousHash(transactionChain) : "0";          
    let transaction = await Transaction.findOneAndUpdate({ "userId": initiator }, 
        { 
            $push: { 
                transactionChain: {
                    sender: req.body.userId,
                    receiver: user._id,
                    amount: req.body.amount,
                    status: req.body.status,
                    hash: hash,
                    action: action,
                    previousHash: previousHash
                } 
            } 
        },
        { upsert: true, runValidators: true, new: true });

    return transaction;
}

async function updateTransaction(id, status, nonce){
    return await Transaction.findOneAndUpdate({ 'transactionChain._id': id}, { $set: { 'transactionChain.$.status': status, 'transactionChain.$.nonce': nonce } });
}

async function validateTransaction(nonceArray, senderTransactionId, receiverTransactionId){
    var nonceFrequency = {};
    var maxEl = nonceArray[0], maxCount = 1;
    for(var i = 0; i < nonceArray.length; i++)
    {
        var el = nonceArray[i];
        if(nonceFrequency[el] == null)
            nonceFrequency[el] = 1;
        else
            nonceFrequency[el]++;  
        if(nonceFrequency[el] > maxCount)
        {
            maxEl = el;
            maxCount = nonceFrequency[el];
        }
    }
    if(maxCount > nonceArray.length/2){
        let status = 'success';
        let nonce = maxEl;
        await updateTransaction(senderTransactionId, status, nonce);
        await updateTransaction(receiverTransactionId, status, nonce);
    }else{
        let status = 'fail';
        let nonce = -1;
        await updateTransaction(senderTransactionId, status, nonce);
        await updateTransaction(receiverTransactionId, status, nonce);
    }

    return;
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
            let senderTransaction = await addTransaction(hash, 'sent', req, user, req.body.userId);
            let receiverTransaction = await addTransaction(hash, 'received', req, user, user._id);
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
                            await updateTransaction(senderTransactionId, status, nonce);
                            await updateTransaction(receiverTransactionId, status, nonce);
                        }else{
                            let nonceKeys = Object.keys(nonceJson);
                            let nonceArray = nonceKeys.map(key => {
                                return nonceJson[key];
                            })
                            // console.log(nonceArray);
                            console.log("Validating Transactions...");
                            await validateTransaction(nonceArray, senderTransactionId, receiverTransactionId);
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