const Account = require("../models/Account");
const utils = require("../utils");
const moment = require("moment");
const { generateRandomStr, sha256 } = require("../utils");
const sendEmail = require("../utils/nodeMailer");
const jwt = require("jsonwebtoken");

const accountController = {
    signIn: async (req, res) => {
        try {
            let account;
            if (req.headers.authorization) {
                const accessToken = req.headers.authorization.split(" ")[1];

                account = await Account.findOne({
                    accessToken: accessToken,
                });
                if (!account) {
                    return res.send({
                        result: "failed",
                        message: "Không đủ quyền truy cập",
                    });
                }

                return res.send({
                    result: "success",
                    account: account,
                });
            } else {
                account = await Account.findOne({
                    email: req.body.email,
                });
            }

            if (!account) {
                return res.status(404).json({
                    result: "failed",
                    message: "Tài khoản không tồn tại",
                });
            }

            const hashed = await utils.sha256(req.body.password);
            const validPassword = hashed === account.password;

            if (!validPassword) {
                return res.status(404).json({
                    result: "failed",
                    message: "Sai mật khẩu",
                });
            }

            let responseAccount;

            // if (!account.accessToken || moment(account.expirationDateToken).diff(moment.now()) < 0) {
            var token = await jwt.sign({ email: req.body.email }, "IOT");
            var expirationDate = new Date();
            var time = expirationDate.getTime();
            var time1 = time + 24 * 3600 * 1000;
            var setTime = expirationDate.setTime(time1);
            var expirationDateStr = moment(setTime).format("YYYY-MM-DD HH:mm:ss").toString();

            responseAccount = await Account.findByIdAndUpdate(
                account._id,
                {
                    accessToken: token,
                    expirationDateToken: expirationDateStr,
                },
                { new: true }
            );
            // }

            return res.send({
                result: "success",
                account: responseAccount,
            });
        } catch (err) {
            res.status(500).json({
                result: "failed",
                error: err.message,
            });
        }
    },

    signUp: async (req, res) => {
        try {
            //check Account existent
            let account = await Account.findOne({
                email: req.body.email,
            });

            if (account) {
                return res.send({
                    result: "failed",
                    message: "Tài khoản đã tồn tại",
                });
            }

            const hashed = await utils.sha256(req.body.password);
            var accessToken = generateRandomStr(32);

            const newAccount = new Account({
                accessToken: accessToken,
                fullname: req.body.fullname,
                email: req.body.email,
                password: hashed,
                expirationDateToken: null,
            });

            await newAccount.save();

            return res.send({
                result: "success",
                account: newAccount,
            });
        } catch (err) {
            res.status(500).send({
                result: "failed",
                message: err,
            });
        }
    },

    signOut: async (req, res) => {
        try {
            const accessToken = req.headers.authorization.split(" ")[1];
            const account = await Account.findOne({
                accessToken: accessToken,
            });
            await account.updateOne({
                accessToken: null,
                expirationDateToken: null,
            });

            const responseAccount = await Account.findOne({
                _id: account._id,
            });
            res.send({
                result: "success",
            });
        } catch (error) {
            res.status(500).send({
                result: "failed",
                reason: error.message,
            });
        }
    },

    requestToResetPassword: async (req, res) => {
        try {
            let { email } = req.body;

            let account = await Account.findOne({
                email: email,
            });

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "email không hợp lệ",
                });
            }
            var random = 100000 + Math.random() * 900000;
            var plainResetPasswordToken = Math.floor(random);

            const hashedResetPasswordToken = await utils.sha256(plainResetPasswordToken.toString());

            // var expirationDate = new Date()
            // var time = expirationDate.getTime()
            // var time1 = time + 5 * 60 * 1000
            // var setTime = expirationDate.setTime(time1)
            // var expirationDateStr = moment(setTime)
            //     .format("YYYY-MM-DD HH:mm:ss")
            //     .toString()

            await Account.findOneAndUpdate(
                {
                    email: email,
                },
                {
                    password: hashedResetPasswordToken,
                    // expirationDateResetPasswordToken: expirationDateStr,
                }
            );

            await sendEmail(email, "Đặt lại mật khẩu SmartGardent", plainResetPasswordToken);

            res.send({
                result: "success",
                // expirationDate: moment(expirationDate).toDate(),
            });
        } catch (error) {
            res.send({
                result: "failed",
                message: error,
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            let { email, resetPasswordToken, newPassword } = req.body;

            let account = await Account.findOne({
                email: email,
            });

            const hashedResetPasswordToken = utils.sha256(resetPasswordToken);

            const hashedPassword = utils.sha256(newPassword);

            if (!account) {
                return res.send({
                    result: "failed",
                    message: "Đổi mật khẩu không thành công",
                });
            }

            if (account.resetPasswordToken === hashedResetPasswordToken) {
                await Account.findOneAndUpdate(
                    {
                        email: email,
                    },
                    {
                        resetPasswordToken: null,
                        expirationDateResetPasswordToken: null,
                        password: hashedPassword,
                    }
                );
                return res.send({
                    result: "success",
                    message: "Thay đổi mật khẩu thành công",
                });
            }
        } catch (error) {
            res.send({
                result: "failed",
                message: error,
            });
        }
    },
    changePassword: async (req, res) => {
        try {
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });
            const password = await sha256(req.body.password);
            const newPassword = await sha256(req.body.newPassword);

            if (account) {
                if (password === account.password) {
                    await Account.findByIdAndUpdate(account.id, {
                        password: newPassword,
                    });
                    return res.send({
                        result: "success",
                        message: "Đổi mật khẩu thành công",
                    });
                }
                return res.send({
                    result: "failed",
                    message: "Mật khẩu cũ không chính xác",
                });
            }
            return res.send({
                result: "faled",
                message: "Sai email",
            });
        } catch (err) {
            res.send({
                result: "faled",
                message: err,
            });
        }
    },
};

module.exports = accountController;
