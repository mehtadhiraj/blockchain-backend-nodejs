const Transaction = require('../models/Transaction');

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
        if(nonceFrequency[el] > maxCount){
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

module.exports = {
    addTransaction,
    validateTransaction,
    updateTransaction
}