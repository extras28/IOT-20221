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
            const oldPlant = await Plant.findOne({ plantId: plantId });
            if (oldPlant) {
                return res.status(404).json({
                    result: "failed",
                    message: "Cây với id này đã tồn tại",
                });
            }
            const plant = new Plant({
                plantId: plantId,
                name: name,
                plantHumidity: 0,
                enviromentHumidity: 0,
                enviromentTemperature: 0,
                numberOfWatteringTimeThisDay: 0,
                accountId: account._id,
                enviromentHumidityBreakpoint: 0,
                enviromentTemperatureBreakpoint: 0,
                plantHumidityBreakpoint: 0,
                autoMode: false,
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
            const { enviromentTemperature, enviromentHumidity, plantId, plantHumidity } = data;

            const plant = await Plant.findOne({ plantId: plantId });

            if (plant) {
                await plant.updateOne({
                    enviromentTemperature: enviromentTemperature,
                    enviromentHumidity: enviromentHumidity,
                    plantHumidity: plantHumidity,
                });
                if (!plant.autoMode) {
                    // res.status(200).json({
                    //     result: "success",
                    //     plant: plant,
                    // });
                    return;
                }
                if (
                    // parseFloat(enviromentTemperature) > plant.enviromentTemperatureBreakpoint ||
                    // parseFloat(enviromentHumidity) < plant.enviromentHumidityBreakpoint ||
                    parseFloat(plantHumidity) < plant.plantHumidityBreakpoint
                ) {
                    client.publish(
                        topic,
                        JSON.stringify({
                            requestCode: 1,
                            plantId: plantId,
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
                } else {
                    client.publish(
                        topic,
                        JSON.stringify({
                            requestCode: 0,
                            plantId: plantId,
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
                }
                // res.status(200).json({
                //     result: "success",
                //     plant: plant,
                // });
            } else {
                res.status(200).json({
                    result: "failed",
                    message: "Không tìm được cây",
                });
            }

            // await Plant.findOneAndUpdate(
            //     { plantId: sensorId },
            //     {
            //         temperature: temperature,
            //         humidity: humidity,
            //     }
            // );
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

            if (!autoMode) {
                client.publish(
                    topic,
                    JSON.stringify({
                        requestCode: 0,
                        plantId: plantId,
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
            }

            const plant = await Plant.findOneAndUpdate(
                { plantId: plantId },
                {
                    autoMode: autoMode,
                },
                { new: true }
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
            const { plantId, enviromentTemperatureBreakpoint, enviromentHumidityBreakpoin, plantHumidityBreakpoint } = req.body;
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
                    enviromentTemperatureBreakpoint: parseFloat(enviromentTemperatureBreakpoint),
                    enviromentHumidityBreakpoint: parseFloat(enviromentHumidityBreakpoin),
                    plantHumidityBreakpoint: parseFloat(plantHumidityBreakpoint),
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
