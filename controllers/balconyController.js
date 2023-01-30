const Account = require("../models/Account");
const Balcony = require("../models/Balcony");

const balconyController = {
    createBalcony: async (req, res) => {
        try {
            const { name } = req.body;
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
                    name: name,
                    humidity: 0,
                    temperature: 0,
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

            const balconies = await Balcony.find();

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

            const balcony = await Balcony.findOne({ _id: balconyId }).populate({ path: "plants" });
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
};

module.exports = balconyController;
