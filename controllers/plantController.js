const Account = require("../models/Account");
const Balcony = require("../models/Balcony");
const Plant = require("../models/Plant");
const mqtt = require("mqtt");
const broker = "mqtt://broker.mqttdashboard.com:1883";
const topic = "DUNGNA_RECEIVING";
const options = {};

const client = mqtt.connect(broker, options);

const plantController = {
    create: async (req, res) => {
        try {
            const { name, plantId, balconyId } = req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }
            const plant = new Plant({
                plantId: plantId,
                name: name,
                humidity: 0,
                temperature: 0,
                numberOfWatteringTimeThisDay: 0,
                accountId: account._id,
            });

            await plant.save();

            await Balcony.findByIdAndUpdate(balconyId, {
                $push: {
                    plants: plant._id,
                },
            });

            res.status(200).json({
                result: "success",
                plant: plant,
            });
        } catch (error) {
            res.status(404).json({
                result: "failed",
                message: error.message,
            });
        }
    },

    control: async (req, res) => {
        try {
            const { plantId, requestCode } = req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            client.publish(
                topic,
                JSON.stringify({
                    requestCode: parseInt(requestCode),
                    plantId: plantId,
                }),
                (err) => {
                    if (err) {
                        return res.send({
                            result: "failed",
                            message: err.message,
                        });
                    } else {
                        return res.send({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );
        } catch (error) {
            res.status(404).json({
                result: "failed",
                message: error.message,
            });
        }
    },

    updateData: async (data) => {
        try {
            const { temperature, humidity, sensorId } = data;
            await Plant.findOneAndUpdate(
                { plantId: sensorId },
                {
                    temperature: temperature,
                    humidity: humidity,
                }
            );
        } catch (error) {
            console.log({
                result: "failed",
                message: "Can not update plant data",
                reason: error.message,
            });
        }
    },

    detail: async (req, res) => {
        try {
            const { plantId } = req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            const plant = await Plant.findOne({ plantId: plantId });

            if (plant) {
                res.status(200).json({
                    result: "success",
                    plant: plant,
                });
            } else {
                res.status(200).json({
                    result: "failed",
                    message: "Không tìm được cây",
                });
            }
        } catch (error) {
            res.status(404).json({
                result: "failed",
                message: error.message,
            });
        }
    },
};

module.exports = plantController;
