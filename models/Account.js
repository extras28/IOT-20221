const mongoose = require('mongoose');

const Account = new mongoose.Schema({
    fullname: String,
    email: {
        type: String,
        require: true,
        unique: true,
    },
    password: String,
    accessToken: String,
    expirationDateToken: Date,
    resetPasswordToken: String,
    expirationDateResetPasswordToken: String,
}, {
    timestamps: true,
});

module.exports = mongoose.model('account', Account);
