const mongoose = require("mongoose");

const plant = new mongoose.Schema(
    {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
        plantId: String,
        name: String,
        plantHumidity: Number,
        enviromentTemperature: Number,
        enviromentHumidity: Number,
        numberOfWatteringTimeThisDay: Number,
        autoMode: Boolean,
        enviromentTemperatureBreakpoint: Number,
        enviromentHumidityBreakpoint: Number,
        plantHumidityBreakpoint: Number,
        image: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("plant", plant);
