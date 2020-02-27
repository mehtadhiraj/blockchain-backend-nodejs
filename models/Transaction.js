const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionChain: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        previousHash: {
            type: String,
        },
        status: {
            type: String,
            enum: ['pending', 'fail', 'cancel', 'success']
        },
        nonce: {
            type: Number
        },
        hash: {
            type: String,
            required: true
        },
        action: {
            type: String,
            enum: ['sent', 'received']
        }
    }]
},{
    timestamps: true,
    strict: true
})

module.exports = mongoose.model("Transaction", transactionSchema);