const mongoose = require("mongoose");

const balcony = new mongoose.Schema(
    {
        account: { type: mongoose.Schema.Types.ObjectId, ref: "account" },
        name: String,
        humidity: Number,
        temperature: Number,
        plants: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: "plant",
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("balcony", balcony);
