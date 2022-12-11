const mongoose = require('mongoose');

const Garden = new mongoose.Schema({
    gardenName: String,
    gardenHumidity: String,
    gardenTemerature: String,
}, {
    timestamps
});

module.exports = mongoose.model('Garden', Garden);
