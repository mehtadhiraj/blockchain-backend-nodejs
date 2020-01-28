const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactioChain: [{
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
        nextHash: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'fail', 'cancel', 'success']
        }
    }]
},{
    timestamps: true
})

module.exports = mongoose.model("Transaction", transactionSchema);