const mongoose = require("mongoose");

const plant = new mongoose.Schema(
    {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
        plantId: String,
        name: String,
        humidity: Number,
        temperature: Number,
        numberOfWatteringTimeThisDay: Number,
        autoMode: Boolean,
        temperatureBreakpoint: Number,
        humidityBreakpoint: Number,
    },
    { timestamps: true }
);

module.exports = mongoose.model("plant", plant);
