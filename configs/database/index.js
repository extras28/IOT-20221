const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://extras28:nguyenanhdung28@extras28.qswwap5.mongodb.net/iot?retryWrites=true&w=majority`
        );
        console.log("connected to MongoDB successfuly");
    } catch (error) {
        console.log("connect faile");
        console.log(error.message);
    }
};

module.exports = {
    connect,
};
