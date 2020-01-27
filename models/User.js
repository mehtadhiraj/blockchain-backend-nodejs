const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    privateKey:{
        type: String,
        required: true,
        unique: true,
        default: null
    }
},{
    timestamps: true
});

// Hashing password before saving in the database.
userSchema.pre('save', function(next){
    var user = this;
    if (!user.isModified('password')) return next();
 
    bcrypt.genSalt(parseInt(process.env.SALT_WORK_FACTOR), function(err, salt){
        if(err) return next(err);
 
        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err);
 
            user.password = hash;
            next();
        });
    });
});

// Hashing password before saving in the database.
userSchema.pre('save', function(next){
    var user = this;
    if (!user.isModified('privateKey')) return next();
 
    bcrypt.genSalt(parseInt(process.env.SALT_WORK_FACTOR), function(err, salt){
        if(err) return next(err);
 
        bcrypt.hash(user.privateKey, salt, function(err, hash){
            if(err) return next(err);
 
            user.privateKey = hash;
            next();
        });
    });
});

// Adding comparePassword method to User Schema
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);

