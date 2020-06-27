const Account         = require('../models/Account');
const Transaction     = require('../models/Transaction');
const User            = require('../models/User');
const transaction     = require('./transactionFunctions');
const CryptoJs        = require("crypto-js");
const stringify       = require('json-stable-stringify');
const firebase        = require('../config/firebase');
let activeTransaction = {};

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
            10. Compare minner nonce hash and hashing of hash value
            11. Validate chain
            12. check match between chain and block validation
            13. Add transaction or fail transaction 
            14. Set firebase ref for broadcast
            15. Encrypt the chain
            16. Set a broadcast value
        */

        // console.log(req.body);
        // 1. Find whether receiver exist or not if exist continue else throw an error.
        let receiver = await User.findOne({ username: req.body.receiver });
        if(!receiver)
            throw new Error("Receiver does not exist.");
        
        let sender = await User.findById({ _id: req.body.userId });
        // console.log({ sender, receiver });
        if(sender._id.toString() === receiver._id.toString())
            throw new Error("Self Transfer of money cannot be done");

        if(activeTransaction[sender._id] || activeTransaction[receiver._id])
            throw new Error("Server busy. Please try again later.");
        else{   
            activeTransaction[sender._id] = sender._id;
            activeTransaction[receiver._id] = receiver._id;
            // console.log({activeTransaction});
        }
        
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
            try{
                this.nonceArray = await transaction.retrieveFirebase(transactionRef, "nonce");
                this.senderChainArray = await transaction.retrieveFirebase(senderRef, "hash");
                senderRef.remove();
                this.receiverChainArray = await transaction.retrieveFirebase(receiverRef, "hash");
                receiverRef.remove();
                this.nonceHashArray = await transaction.retrieveFirebase(transactionRef, "nonceHash");
                transactionRef.remove();
                // console.log(this.nonceArray, this.senderChainArray, this.receiverChainArray, this.nonceHashArray);
                
                // 9. Validating block by finding max value of occurence of nonce
                let nonceValidation = await transaction.validateTransaction(this.nonceArray);
                let nonceHashValidation = await transaction.validateTransaction(this.nonceHashArray);
                // console.log({ nonceValidation, nonceHashValidation });

                // 10. Compare a nonce hash on server and nonce hash received from minner by encrypting it using nonce number
                let encryptedHash = await (await transaction.encrypt(nonceValidation.maxEl.toString(), hash.toString()));
                // console.log(encryptedHash.toString());
                if(encryptedHash.toString() != nonceHashValidation.maxEl)
                    throw new Error("Transaction Failed!!");

                // 11. Validating chain by finding maximum occurence of chain
                let senderChainValidation = await transaction.validateChain(senderPassword, senderChainEncrypt, this.senderChainArray, sender._id);
                let receiverChainValidation = await transaction.validateChain(receiverPassword, receiverChainEncrypt, this.receiverChainArray, receiver._id);
                // console.log({ senderChainValidation, receiverChainValidation });
                
                // 12. check whether all the max counts for block and chain are equal
                let count = nonceValidation.maxCount;
                let maxElement = -1;
                let resultOfCount = nonceHashValidation.maxCount === count;
                let resultOfMaxEl = nonceValidation.maxEl != maxElement;
                // console.log({resultOfCount, resultOfMaxEl});
                resultOfCount = resultOfCount && (senderChainValidation.maxCount === count);
                resultOfMaxEl = resultOfMaxEl && (senderChainValidation.maxEl != maxElement);
                // console.log({resultOfCount, resultOfMaxEl});
                reesultOfCount = resultOfCount && (receiverChainValidation.maxCount === count);
                resultOfMaxEl = resultOfMaxEl && (receiverChainValidation.maxEl != maxElement);
                // console.log({resultOfCount, resultOfMaxEl});
                // console.log(resultOfCount && resultOfMaxEl);
                if( resultOfCount && resultOfMaxEl ){
                    block.status = "success";
                    block.nonce = nonceValidation.maxEl;
                    // console.log({block, hash, sender, receiver});

                    // 13. Add transaction as successfull in the database
                    senderTransaction = await transaction.addTransaction(hash, "sent", block, sender._id);
                    receiverTransaction = await transaction.addTransaction(hash, "received", block, receiver._id);
                    // console.log({senderTransaction,receiverTransaction});
                    timeStamp = Date.now();

                    // 14. Set reffrence for broadcast
                    let broadCastRef = firebase.ref('/broadcast');
                    senderRef = firebase.ref('broadcast/'+sender._id+'-'+timeStamp);
                    receiverRef = firebase.ref('broadcast/'+receiver._id+'-'+timeStamp);

                    // 15. Encrypt the chain to be broadcast
                    senderChainEncrypt = await transaction.encrypt(senderPassword, senderTransaction.transactionChain);
                    receiverChainEncrypt = await transaction.encrypt(receiverPassword, receiverTransaction.transactionChain);

                    // 16. Set the vlaue in firebase
                    broadCastRef.remove();
                    senderRef.set({chain: senderChainEncrypt});
                    receiverRef.set({chain: receiverChainEncrypt});
                    delete activeTransaction[sender._id];
                    delete activeTransaction[receiver._id];
                    res.json({
                        status: 200,
                        message: "Transaction Successfull.\n-->Sender: "+sender.username+"\n-->Receiver: "+receiver.username+"\n-->Amount: "+block.amount.toString()
                    })
                }else{
                    delete activeTransaction[sender._id];
                    delete activeTransaction[receiver._id];
                    throw new Error("Transaction Failed!!\n-->Sender: "+sender.username+"\n-->Receiver: "+receiver.username+"\n-->Amount: "+block.amount.toString());
                }
            }catch (error){
                res.json({
                    status: 204,
                    message: error.message
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