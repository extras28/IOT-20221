const Account = require("../models/Account");
const Balcony = require("../models/Balcony");
const Plant = require("../models/Plant");
const mqtt = require("mqtt");
const utils = require("../utils");
const broker = "mqtt://broker.mqttdashboard.com:1883";
const topic = "DUNGNA_RECEIVING";
const options = {};

const client = mqtt.connect(broker, options);

const plantController = {
    create: async (req, res) => {
        try {
            const plants = await Plant.find({ balconyId: "EC:FA:BC:28:0E:66" });
            // const plant = plants.find((item) => {
            //     console.log(item.plantId);
            //     return item.plantId === "EC:FA:BC:28:0E:660";
            // });
            // console.log(plant);
            let testArr = [];
            for (let i = 0; i < 15; i++) {
                const havePlant = plants.find((item) => {
                    return item.plantId == `EC:FA:BC:28:0E:66${i}`;
                });
                testArr = testArr.concat(havePlant);
            }
            res.send({
                plants: plants,
                havePlant: testArr,
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
                    flag: 0,
                    requestCode: parseInt(requestCode),
                    plantId: parseInt(plantId.slice(-1)),
                    balconyId: plantId.slice(0, plantId.length - 1),
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
            const { balconyId, enviromentTemperature, enviromentHumidity, sensorArr } = data;
            const plants = await Plant.find({ balconyId: balconyId });
            for (let i = 0; i < sensorArr.length; i++) {
                const havePlant = plants.find((item) => {
                    return item.plantId == `EC:FA:BC:28:0E:66${i}`;
                });
                if (sensorArr[i] < 100) {
                    if (havePlant) {
                        await Plant.findOneAndUpdate(
                            { plantId: balconyId + i.toString() },
                            {
                                soilMoisture: sensorArr[i],
                            }
                        );
                    } else {
                        const newPlant = new Plant({
                            balconyId: balconyId,
                            plantId: balconyId + i.toString(),
                            name: `Cây số ${i}`,
                            soilMoisture: sensorArr[i],
                            autoMode: false,
                            status: "PENDING",
                            image: "https://i.pinimg.com/236x/40/d1/0f/40d10f4bf9cbad18736419123528d989.jpg",
                        });
                        await newPlant.save();
                    }
                } else {
                    if (havePlant) {
                        await Plant.findOneAndDelete({ plantId: balconyId + i.toString() });
                    }
                }
            }
        } catch (error) {
            console.log({
                result: "failed",
                message: "Không thể cập nhật dữ liệu cho cây",
                reason: error.message,
            });
        }
    },

    detail: async (req, res) => {
        try {
            const { plantId } = req.query;

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

            // console.log(plant._id);

            const balcony = await Balcony.findOne({ plants: { $in: [plant?._id] } });
            return res.json({
                balcony: balcony,
            });
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

    toggleAutoMode: async (req, res) => {
        try {
            const { plantId, autoMode } = req.body;
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

            const plant = await Plant.findOneAndUpdate(
                { plantId: plantId },
                {
                    autoMode: autoMode,
                },
                { new: true }
            );

            client.publish(
                topic,
                JSON.stringify({
                    autoMode: autoMode,
                    plantId: plantId,
                    soilHumidityBreakpoint: plant.plantHumidityBreakpoint,
                }),
                (err) => {
                    if (err) {
                        return console.log({
                            result: "failed",
                            message: err.message,
                        });
                    } else {
                        console.log({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );

            if (plant) {
                res.status(200).json({
                    result: "success",
                    plant: plant,
                    message: `Chế độ tự động đã được ${autoMode ? "bật" : "tắt"} đối với cây ${plantId}`,
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

    // findAll
    setBreakpoint: async (req, res) => {
        try {
            const { plantId, enviromentTemperatureBreakpoint, enviromentHumidityBreakpoin, plantHumidityBreakpoint } =
                req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(403).send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            const plant = await Plant.findOneAndUpdate(
                { plantId: plantId },
                {
                    // enviromentTemperatureBreakpoint: parseFloat(enviromentTemperatureBreakpoint),
                    // enviromentHumidityBreakpoint: parseFloat(enviromentHumidityBreakpoin),
                    plantHumidityBreakpoint: parseFloat(plantHumidityBreakpoint),
                },
                { new: true }
            );

            client.publish(
                topic,
                JSON.stringify({
                    soilHumidityBreakpoint: parseInt(plantHumidityBreakpoint),
                    plantId: plantId,
                    autoMode: plant.autoMode,
                }),
                (err) => {
                    if (err) {
                        return console.log({
                            result: "failed",
                            message: err.message,
                        });
                    } else {
                        console.log({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );

            if (plant) {
                res.status(200).json({
                    result: "success",
                    message: "Cập nhật thành công",
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

    find: async (req, res) => {
        try {
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(403).send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            const plants = await Plant.find();

            return res.status(200).send({
                result: "success",
                plants: plants,
            });
        } catch (error) {
            res.status(404).json({
                result: "failed",
                message: error.message,
            });
        }
    },
};

module.exports = plantController;
