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
    try {
        /* 
            TODO:
            1. Check existence of receiver
            2. Get sender receiver passwords
            3. Get transaction details
            4. Encrypt transaction
            5. Create a block and hash it
            6. create firebase ref for block and chain
            7. Set the values in firebase
            8. Retrieve data from firebase
            9. Validate block (current transaction)
            10. Validate chain
            11. check match between chain and block validation
            12. Add transaction or fail transaction 
            13. Set firebase ref for broadcast
            14. Encrypt the chain
            15. Set a broadcast value
        */

        // console.log(req.body);
        // 1. Find whether receiver exist or not if exist continue else throw an error.
        let receiver = await User.findOne({ username: req.body.receiver });
        if(!receiver)
            throw new Error("Receiver does not exist.");
        
        let sender = await User.findById({ _id: req.body.userId });
        // console.log({ sender, receiver });
        
        // 2. Get user passwords
        let senderPassword = sender.privateKey;
        let receiverPassword = receiver.privateKey;
        // console.log({ senderPassword, receiverPassword });

        // 3. Get the current transaction details of sender and receiver
        let transactionDetails = await Transaction.find({$or : [ { userId: sender._id }, { userId: receiver._id } ] } );
        // console.log({ transactionDetails }); 
        let senderTransaction = transactionDetails[0] ? transactionDetails[0] : {transactionChain: []};
        let receiverTransaction = transactionDetails[1] ? transactionDetails[1] : {transactionChain: []};
        // console.log({ senderTransaction, receiverTransaction });

        // 4. Encrypt the current chain of sender and receiver
        let senderChainEncrypt = await transaction.encrypt(senderPassword, senderTransaction.transactionChain);
        let receiverChainEncrypt = await transaction.encrypt(receiverPassword, receiverTransaction.transactionChain);
        // console.log({ senderChainEncrypt, receiverChainEncrypt });

        // 5. Creating a block and generating a hash value for it.
        let timeStamp = Date.now();
        let block = {
            sender: sender._id,
            receiver: receiver._id,
            amount: req.body.amount,
            timeStamp: timeStamp
        }  
        // console.log({block});
        let hash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
        // console.log({hash});

        // 6. Set firebase refernce for transaction, senderChain and receierChain
        timeStamp = Date.now();
        let transactionRef = firebase.ref('transactions/'+sender._id.toString()+'-'+receiver._id.toString()+'-'+timeStamp),
            senderRef      = firebase.ref('transactions/'+sender._id+'-'+timeStamp),
            receiverRef    = firebase.ref('transactions/'+receiver._id+'-'+timeStamp);
        // console.log({ transactionRef, senderRef, receiverRef });
        
        // 7. Set the values in firebase
        let transactionData = { hash: hash },
            senderData      = { encryptedChain: senderChainEncrypt },
            receiverData    = { encryptedChain: receiverChainEncrypt };
        // console.log({ transactionData, senderData, receiverData });
        transactionRef.set(transactionData);
        senderRef.set(senderData);
        receiverRef.set(receiverData);
        let nonceArray = senderChainArray = receiverChainArray = [];
        // 8. Retrieve nonce and chain details from firebase
        setTimeout(async ()=>{
            this.nonceArray = await transaction.retrieveFirebase(transactionRef, "nonce");
            this.senderChainArray = await transaction.retrieveFirebase(senderRef, "hash");
            this.receiverChainArray = await transaction.retrieveFirebase(receiverRef, "hash");
            // console.log(this.nonceArray, this.senderChainArray, this.receiverChainArray);
            
            // 9. Validating block by finding max value of occurence of nonce
            let nonceValidation = await transaction.validateTransaction(this.nonceArray);
            
            // 10. Validating chain by finding maximum occurence of chain
            let senderChainValidation = await transaction.validateChain(senderPassword, senderChainEncrypt, this.senderChainArray, sender._id);
            let receiverChainValidation = await transaction.validateChain(receiverPassword, receiverChainEncrypt, this.receiverChainArray, receiver._id);
            // console.log({ senderChainValidation, receiverChainValidation, nonceValidation });
            
            // 11. check whether all the max counts for block and chain are equal
            if( senderChainValidation.maxCount == receiverChainValidation.maxCount == nonceValidation.maxCount && senderChainValidation.maxEl != -1 && receiverChainValidation.maxEl != -1 && nonceValidation.maxEl != -1 ){
                block.status = "success";
                block.nonce = nonceValidation.maxEl;
                // console.log({block, hash, sender, receiver});

                // 12. Add transaction as successfull in the database
                senderTransaction = await transaction.addTransaction(hash, "sent", block, sender._id);
                receiverTransaction = await transaction.addTransaction(hash, "received", block, receiver._id);
                // console.log({senderTransaction,receiverTransaction});
                timeStamp = Date.now();

                // 13. Set reffrence for broadcast
                let broadCastRef = firebase.ref('/broadcast');
                senderRef = firebase.ref('broadcast/'+sender._id+'-'+timeStamp);
                receiverRef = firebase.ref('broadcast/'+receiver._id+'-'+timeStamp);

                // 14. Encrypt the chain to be broadcast
                senderChainEncrypt = await transaction.encrypt(senderPassword, senderTransaction.transactionChain);
                receiverChainEncrypt = await transaction.encrypt(receiverPassword, receiverTransaction.transactionChain);

                // 15. Set the vlaue in firebase
                broadCastRef.remove();
                senderRef.set({chain: senderChainEncrypt});
                receiverRef.set({chain: receiverChainEncrypt});
                res.json({
                    status: 200,
                    message: "Transaction Successfull.\n-->Sender: "+sender.username+"\n-->Receiver: "+receiver.username+"\n-->Amount: "+block.amount.toString()
                })
            }else{
                res.json({
                    status: 204,
                    message: "Transaction Failed!!\n-->Sender: "+sender.username+"\n-->Receiver: "+receiver.username+"\n-->Amount: "+block.amount.toString()
                })
            }
        }, 30000)         
    } catch (error) {
        // console.log(error.message);
        res.json({
            status: 204,
            message: error.message
        })
    }
}

module.exports.gettransaction = async function(req, res){
    try {
        // console.log(req.body);
        let transactionDetails = await Transaction.findOne({ userId: req.body.userId }).populate('transactionChain.sender').populate('transactionChain.receiver');
        if(transactionDetails){
            // console.log(transactionDetails.transactionChain);
            res.json({
                status: 202,
                transactionChain: transactionDetails.transactionChain
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