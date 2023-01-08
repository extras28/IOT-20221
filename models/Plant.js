const mongoose = require("mongoose");

const plant = new mongoose.Schema(
    {
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
        plantId: String,
        name: String,
        humidity: Number,
        temperature: Number,
        numberOfWatteringTimeThisDay: Number,
    },
    { timestamps: true }
);

module.exports = mongoose.model("plant", plant);
