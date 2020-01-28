const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    accountNo: {
        type: String,
        required: true,
        unique: true
    },
    ifsc: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

module.exports = mongoose.model("Account", accountSchema);