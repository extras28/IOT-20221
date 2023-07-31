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
    // create: async (req, res) => {
    //     try {
    //         const plants = await Plant.find({ balconyId: "EC:FA:BC:28:0E:66" });
    //         // const plant = plants.find((item) => {
    //         //     console.log(item.plantId);
    //         //     return item.plantId === "EC:FA:BC:28:0E:660";
    //         // });
    //         // console.log(plant);
    //         let testArr = [];
    //         for (let i = 0; i < 15; i++) {
    //             const havePlant = plants.find((item) => {
    //                 return item.plantId == `EC:FA:BC:28:0E:66${i}`;
    //             });
    //             testArr = testArr.concat(havePlant);
    //         }
    //         res.send({
    //             plants: plants,
    //             havePlant: testArr,
    //         });
    //     } catch (error) {
    //         res.status(404).json({
    //             result: "failed",
    //             message: error.message,
    //         });
    //     }
    // },

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
                    plantId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? parseInt(plantId.slice(-2))
                            : parseInt(plantId.slice(-1)),
                    balconyId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? plantId.slice(0, plantId.length - 2)
                            : plantId.slice(0, plantId.length - 1),
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
            const {
                balconyId,
                enviromentTemperature,
                enviromentHumidity,
                sensorArr,
            } = data;
            const balcony = await Balcony.findOne({ balconyId: balconyId });
            
            if (balcony) {
                await balcony.updateOne({
                    temperature: enviromentTemperature ?? 20,
                    humidity: enviromentHumidity ?? 78,
                });

                const plants = await Plant.find({ balconyId: balconyId });
                for (let i = 0; i < sensorArr.length; i++) {
                    const havePlant = await plants.find((item) => {
                        return item.plantId == `${balconyId}${i}`;
                    });
                    // if (sensorArr[i] < 100) {
                    if (havePlant) {
                        await Plant.findOneAndUpdate(
                            { plantId: balconyId + i.toString() },
                            {
                                soilMoisture: sensorArr[i],
                                envTemp: enviromentTemperature,
                                envHumi: enviromentHumidity,
                            }
                        );
                    }
                    // else {
                    //     const newPlant = new Plant({
                    //         balconyId: balconyId,
                    //         plantId: balconyId + i.toString(),
                    //         name: `Cây số ${i}`,
                    //         soilMoisture: sensorArr[i],
                    //         envTemp: enviromentTemperature,
                    //         envHumi: enviromentHumidity,
                    //         autoMode: false,
                    //         status: "PENDING",
                    //         image: "https://i.pinimg.com/236x/40/d1/0f/40d10f4bf9cbad18736419123528d989.jpg",
                    //     });
                    //     await newPlant.save();
                    // }
                    // }
                    // else {
                    //     if (havePlant) {
                    //         await Plant.findOneAndDelete({ plantId: balconyId + i.toString() });
                    //     }
                    // }
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

            // const balcony = await Balcony.findOne({ plants: { $in: [plant?._id] } });
            // return res.json({
            //     balcony: balcony,
            // });
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
                { autoMode: autoMode }
            );

            client.publish(
                topic,
                JSON.stringify({
                    flag: 1,
                    autoMode: autoMode,
                    plantId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? parseInt(plantId.slice(-2))
                            : parseInt(plantId.slice(-1)),
                    balconyId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? plantId.slice(0, plantId.length - 2)
                            : plantId.slice(0, plantId.length - 1),
                    soilMoistureBreakpoint: plant.soilMoistureBreakpoint,
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

            plant.updateOne({ autoMode: autoMode });

            if (plant) {
                res.status(200).json({
                    result: "success",
                    plant: plant,
                    message: `Chế độ tự động đã được ${
                        autoMode ? "bật" : "tắt"
                    } đối với cây ${plantId}`,
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

    setBreakpoint: async (req, res) => {
        try {
            const { plantId, soilMoistureBreakpoint } = req.body;
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
                { soilMoistureBreakpoint: soilMoistureBreakpoint }
            );

            client.publish(
                topic,
                JSON.stringify({
                    flag: 2,
                    autoMode: plant.autoMode,
                    plantId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? parseInt(plantId.slice(-2))
                            : parseInt(plantId.slice(-1)),
                    balconyId:
                        parseInt(plantId.slice(17, 19)) > 9
                            ? plantId.slice(0, plantId.length - 2)
                            : plantId.slice(0, plantId.length - 1),
                    soilMoistureBreakpoint: soilMoistureBreakpoint,
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
            const { balconyId } = req.query;
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

            const plants = await Plant.find({ balconyId: balconyId });

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

    update: async (req, res) => {
        try {
            const { plantId, name, image } = req.body;
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
                    name: name,
                    image: image,
                },
                { new: true }
            );

            return res.status(200).json({
                result: "success",
                plant: plant,
            });
        } catch (error) {
            res.status(400).json({
                result: "failed",
                message: error.message,
            });
        }
    },

    create: async (req, res) => {
        try {
            const { name, plantOrder, balconyId } = req.body;

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

            const balcony = await Balcony.findOne({ balconyId: balconyId });
            const checkedPlant = await Plant.findOne({
                plantId: balconyId + plantOrder,
            });
            if (checkedPlant) {
                return  res.status(400).send({
                    result: "failed",
                    message: "Chân tưới đã tồn tại",
                });
            }
            if (balcony) {
                const newPlant = new Plant({
                    balconyId: balconyId,
                    plantId: balconyId + plantOrder.toString(),
                    name: name,
                    // soilMoisture: sensorArr[plantOrder],
                    // envTemp: enviromentTemperature,
                    // envHumi: enviromentHumidity,
                    autoMode: false,
                    // status: "PENDING",
                    image: "https://i.pinimg.com/236x/40/d1/0f/40d10f4bf9cbad18736419123528d989.jpg",
                });
                await newPlant.save();
                res.status(200).json({
                    result: "success",
                    plant: newPlant,
                });
            } else {
                res.status(400).json({
                    result: "failed",
                    message: "Ban công không tồn tại",
                });
            }
        } catch (error) {
            res.status(400).json({
                result: "failed",
                message: error.message,
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { _id } = req.query;
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
            await Plant.findByIdAndDelete(_id);
            res.status(200).json({
                result: "success",
            });
        } catch (error) {
            res.status(400).json({
                result: "failed",
                message: error.message,
            });
        }
    },
};

module.exports = plantController;
