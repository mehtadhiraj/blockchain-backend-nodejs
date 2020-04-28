const crypto          = require('crypto'),
      Transaction     = require('../models/Transaction');
    
function getPreviousHash(transactionChain){
    let lastTransaction = transactionChain.transactionChain[transactionChain.transactionChain.length - 1];
    previousHash = lastTransaction.hash;
    return previousHash; 
}

async function encrypt(password, chain){
    // console.log({ password, chain });
    let key = crypto.createCipher('aes-128-cbc', password);
    chain = JSON.stringify(chain);
    let hash = key.update(chain, 'utf8', 'hex');
    hash = await hash + key.final('hex');
    // console.log({hash});
    return hash;
}

async function decrypt(password, hash) {
    try{
        let key = crypto.createDecipher('aes-128-cbc', password);
        let chain = key.update(hash, 'hex', 'utf8');
        chain = chain + key.final('utf8');
        chain = JSON.parse(chain);
        // console.log('decrypt')
        // console.log(chain);
        return chain;
    }
    catch (error){
        // console.log(error.message);
        return error;
    }    
}

async function retrieveFirebase(ref, key){
    try{
        let snapArray = [];
        await ref.once("value", (snapshot)=>{
            // console.log(snapshot.val());
            let snapJson = snapshot.val()[key];
            if(!snapJson){
                ref.remove();
                this.snapArray = [];
            }else{
                let snapKeys = Object.keys(snapJson);
                let snapArray = snapKeys.map(index => {
                    return snapJson[index];
                })
                this.snapArray = snapArray;
                // console.log(snapArray);
            }
        });
        // await ref.remove();
        return this.snapArray;
    }
    catch(error){
        return null
    }
}

async function validateChain(password, chain, minnerChainArray, id) {
    let validationData = await validateTransaction(minnerChainArray);
    let validChain = validationData.maxEl;
    if(validChain != chain){
        validChain = await decrypt(password, validChain);
        // console.log({ validChain });
        if(!validChain.message){
            await Transaction.findOneAndUpdate({ userId: id }, { $set: { transactionChain: validChain } }, { upsert: true, runValidators: true, new: true } );
            // validationData.maxEl = validChain;
            return validationData;
        }else{
            return { maxEl: -1, maxCount: -1 }
        }
    }else{
        return validationData;
    }
}

async function getTransaction(userId){
    let transactionDetails = await Transaction.findOne({ userId: userId })
    // console.log({ userId, transactionDetails });
    return transactionDetails;
}

async function addTransaction(hash, action, block, initiator){
    try{
        let transactionChain = await getTransaction(initiator);
        let previousHash = transactionChain ? await getPreviousHash(transactionChain) : "0";          
        let transaction = await Transaction.findOneAndUpdate({ "userId": initiator }, 
            { 
                $push: { 
                    transactionChain: {
                        sender: block.sender,
                        receiver: block.receiver,
                        amount: block.amount,
                        status: block.status,
                        hash: hash,
                        action: action,
                        nonce: block.nonce,
                        previousHash: previousHash
                    } 
                } 
            },
            { upsert: true, runValidators: true, new: true });

        return transaction;
    }
    catch (error) {
        // console.log(error);
        return null;    
    }
}

async function validateTransaction(dataArray){
    let frequency = {};
    if(dataArray.length > 0){
        let maxEl = dataArray[0], maxCount = 1;
        for(let i = 0; i < dataArray.length; i++){
            let el = dataArray[i];
            if(frequency[el] == null)
                frequency[el] = 1;
            else
                frequency[el]++;  
            if(frequency[el] > maxCount){
                maxEl = el;
                maxCount = frequency[el];
            }
        }
        let result = (maxCount > dataArray.length/2) ? { maxEl: maxEl, maxCount: maxCount } : { maxEl: -1, maxCount: -1 };
        return result;
    }else{
        return { maxEl: -1, maxCount: -1 };
    }
}

module.exports = {
    addTransaction,
    validateTransaction,
    validateChain,
    encrypt,
    retrieveFirebase
}