const Account = require("../models/Account");
const utils = require("../utils");
const moment = require("moment");
const { generateRandomStr } = require("../utils");

const accountController = {
    signIn: async (req, res) => {
        try {
            const account = await Account.findOne({
                email: req.body.email,
            })

            if (!account) {
                return res.status(404).json({
                    result: "success",
                    message: "Email không đúng",
                })
            }

            const hashed = await utils.sha256(req.body.password)
            const validPassword = hashed === account.password

            if (!validPassword) {
                return res.status(404).json({
                    result: "failed",
                    message: "Sai mật khẩu",
                })
            }

            if (
                !account.accessToken ||
                moment(account.expirationDateToken).diff(moment.now()) < 0
            ) {
                var accessToken = generateRandomStr(32)
                var expirationDate = new Date()
                var time = expirationDate.getTime()
                var time1 = time + 24 * 3600 * 1000
                var setTime = expirationDate.setTime(time1)
                var expirationDateStr = moment(setTime)
                    .format("YYYY-MM-DD HH:mm:ss")
                    .toString()

                await account.updateOne({
                    accessToken: accessToken,
                    expirationDateToken: expirationDateStr,
                })
            }
            const responseAccount = await Account.findOne({
                _id: account._id,
            })

            return res.send({
                result: "success",
                account: responseAccount.toJSON(),
            })
        } catch (err) {
            res.status(500).json({
                result: "failed",
                error: err,
            })
        }
    },

    signUp: async (req, res) => {
        try {
            //check Account existent
            let account = await Account.findOne({
                email: req.body.email,
            })

            if (account) {
                return res.send({
                    result: "failed",
                    message: "Tài khoản đã tồn tại",
                })
            }

            const hashed = await utils.sha256(req.body.password)

            const newAccount = new Account({
                fullname: req.body.fullname,
                email: req.body.email,
                password: hashed,
                accessToken: "",
                expirationDateToken: null,
            })

            await newAccount.save()

            return res.send({
                result: "success",
                account: newAccount,
            })
        } catch (err) {
            res.status(500).send({
                result: "failed",
                message: err,
            })
        }
    },

    logOut: async (req, res) => {

    }
};

module.exports = accountController;
