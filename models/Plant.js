const mongoose = require("mongoose");

const plant = new mongoose.Schema(
    {
        balconyId: String,
        plantId: String,
        name: String,
        soilMoisture: Number,
        autoMode: Boolean,
        envTemp: Number,
        envHumi: Number,
        soilMoistureBreakpoint: Number,
        status: String,
        image: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("plant", plant);
