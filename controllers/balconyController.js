const Account = require("../models/Account");
const Balcony = require("../models/Balcony");

const balconyController = {
    createBalcony: async (req, res) => {
        try {
            const { name, balconyId } = req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const balcony = await Balcony.findOne({ name: name });

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            if (balcony) {
                return res.send({
                    result: "failed",
                    message: "Tên ban công đã tồn tại",
                });
            } else {
                const newBalcony = new Balcony({
                    account: account._id,
                    balconyId: balconyId,
                    name: name,
                    humidity: 0,
                    temperature: 0,
                    image: "https://i.pinimg.com/564x/05/fc/9d/05fc9d39ac383eea6b85c0321771c326.jpg",
                });
                await newBalcony.save();

                return res.send({
                    result: "success",
                    balcony: newBalcony,
                });
            }
        } catch (error) {
            res.status(500).send({
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
                return res.send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            const balconies = await Balcony.find({ account: account._id });

            return res.send({
                result: "success",
                balconies: balconies,
            });
        } catch (error) {
            res.send({
                result: "failed",
                message: error.message,
            });
        }
    },
    detail: async (req, res) => {
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

            const balcony = await Balcony.findOne({ balconyId: balconyId });
            res.status(200).send({
                result: "success",
                balcony: balcony,
            });
        } catch (error) {
            res.status(404).send({
                result: "failed",
                message: error.message,
            });
        }
    },
    update: async (req, res) => {
        try {
            const { balconyId, image, name } = req.body;

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

            const balcony = await Balcony.findOneAndUpdate(
                { balconyId: balconyId },
                {
                    name: name,
                    image: image,
                },
                { new: true }
            );
            res.status(200).send({
                result: "success",
                balcony: balcony,
            });
        } catch (error) {
            res.status(404).send({
                result: "failed",
                message: error.message,
            });
        }
    },
    delete: async (req, res) => {
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

            await Balcony.findOneAndDelete({ balconyId: balconyId });
            res.status(200).send({
                result: "success",
            });
        } catch (error) {
            res.status(404).send({
                result: "failed",
                message: error.message,
            });
        }
    },
};

module.exports = balconyController;
