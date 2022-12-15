const mongoose = require('mongoose');

const Device = new mongoose.Schema({
    deviceName: String,
    gardenId: String,
    AccountId: String,
    deviceHumidity: String,
    deviceTemperature: String
}, {
    timestamps
});

module.exports = mongoose.model('Device', Device);
