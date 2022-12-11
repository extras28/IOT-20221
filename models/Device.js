const mongoose = require('mongoose');

const Device = new mongoose.Schema({}, {
    timestamps
});

module.exports = mongoose.model('Device', Device);
