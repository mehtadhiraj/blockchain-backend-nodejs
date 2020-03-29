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

// module.exports.initiateTransaction = async function(req, res){
//     try{
//         // console.log(req.body);
//         let user = await User.findOne({ username: req.body.receiver });
//         let initiator = await User.findOne({ _id: req.body.userId });
//         if(!user){
//             res.json({
//                 status: 204,
//                 message: "Requested receiver does not exist"
//             })
//         }else{
//             // console.log({ user, initiator });
//             let senderPassword = initiator.password;
//             let receiverPassword = user.password;
//             // let senderTransaction = await transaction.getTransaction(initiator._id);
//             // senderTransaction = senderTransaction ? senderTransaction : { transactionChain: [] };
//             // let receiverTransaction = await transaction.getTransaction(user._id);
//             // receiverTransaction = receiverTransaction ? receiverTransaction : { transactionChain: [] };
//             let timeStamp = Date.now();
//             let block = {
//                 sender: req.body.userId,
//                 receiver: user['_id'].toString(),
//                 amount: req.body.amount,
//                 timeStamp: timeStamp
//             }  
//             // console.log(block);
//             let hash = await CryptoJs.SHA256(stringify(block)).toString(CryptoJs.enc.Hex);
//             let senderTransaction = await transaction.addTransaction(hash, 'sent', req, user, req.body.userId);
//             let receiverTransaction = await transaction.addTransaction(hash, 'received', req, user, user._id);
//             console.log(senderTransaction, receiverTransaction);
//             let senderChain = [...senderTransaction.transactionChain];
//             senderChain.pop();
//             let receiverChain = [...receiverTransaction.transactionChain];
//             receiverChain.pop();
//             console.log({ senderChain, receiverChain });
//             console.log(senderTransaction, receiverTransaction);
//             if(senderTransaction && receiverTransaction){
//                 let senderTransactionId = senderTransaction.transactionChain[senderTransaction.transactionChain.length - 1]._id.toString();
//                 let receiverTransactionId = receiverTransaction.transactionChain[receiverTransaction.transactionChain.length - 1]._id.toString();
//                 let minnerData = {
//                     senderTransactionId: senderTransactionId,
//                     receiverTransactionId: receiverTransactionId,
//                     hash: hash,
//                     nonce: []
//                 }
//                 // console.log(minnerData);
//                 let ref = firebase.ref('/transactions/'+senderTransactionId+'-'+receiverTransactionId);
//                 let senderRef = firebase.ref('transactions/'+initiator._id);
//                 let receiverRef = firebase.ref('transactions/'+user._id);
//                 let senderChainEncrypt = await transaction.encrypt(senderPassword, senderChain);
//                 let receiverChainEncrypt = await transaction.encrypt(receiverPassword, receiverChain);
//                 console.log({ senderChainEncrypt, receiverChainEncrypt });
//                 ref.set(minnerData);
//                 senderRef.set({ encryptedChain: senderChainEncrypt });
//                 receiverRef.set({ encryptedChain: receiverChainEncrypt });
//                 setTimeout(async ()=>{
//                     await ref.once('value', async function(snapshot){
//                         // console.log(snapshot.val());
//                         let nonceJson = snapshot.val().nonce;
//                         if(!nonceJson){
//                             ref.remove();
//                             let status = 'fail';
//                             let nonce = -1;
//                             await transaction.updateTransaction(senderTransactionId, status, nonce);
//                             await transaction.updateTransaction(receiverTransactionId, status, nonce);
//                         }else{
//                             let senderChainValidation = await transaction.validateChain(senderPassword, senderChainEncrypt, initiator._id, senderRef);
//                             let receiverChainalidation = await transaction.validateChain(receiverPassword, receiverChainEncrypt, user._id, receiverRef);
//                             console.log({ senderChainValidation, receiverChainalidation });                
//                             let nonceKeys = Object.keys(nonceJson);
//                             let nonceArray = nonceKeys.map(key => {
//                                 return nonceJson[key];
//                             })
//                             // console.log(nonceArray);
//                             console.log("Validating Transactions...");
//                             let nonce = await transaction.validateTransaction(nonceArray, senderTransactionId, receiverTransactionId);
//                             let status = ( nonce.maxEl != -1 && (senderChainValidation.maxCount == receiverChainalidation.maxCount == nonce.maxCount) ) ? 'success' : 'fail';
//                             await transaction.updateTransaction(senderTransactionId, status, nonce.maxEl);
//                             await transaction.updateTransaction(receiverTransactionId, status, nonce.maxEl);
//                             console.log("Transaction Validated.");
//                         }
//                     });
//                     ref.remove();
//                 }, 30000)
//                 res.json({
//                     status: 200,
//                     message: "Transaction In Process."
//                 })
//             } 
//         }
//     }catch(error){
//         // console.log(error);
//         res.json({
//             status: 204,
//             message: error.message
//         })
//     }
// }

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
        let senderPassword = sender.password;
        let receiverPassword = receiver.password;
        // console.log({ senderPassword, receiverPassword });

        // 3. Get the current transaction details of sender and receiver
        let transactionDetails = await Transaction.find({$or : [ { userId: sender._id }, { userId: receiver._id } ] } );
        // console.log(transactionDetails); 
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
            }
        }, 30000)         
        res.json({
            status: 200,
            message: "Reload your page after 1 miunte. We are processing transaction..."
        })
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