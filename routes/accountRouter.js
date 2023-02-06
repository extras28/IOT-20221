const express = require('express');
const accountController = require('../controllers/accountController');
const router = express.Router();

//sign up
router.post('/api/v1/account/sign-up', accountController.signUp,);

//sign in
router.post('/api/v1/account/sign-in', accountController.signIn);

//sign out
router.post('/api/v1/account/sign-out',  accountController.signOut);

//change password
router.put('/api/v1/account/change-password', accountController.changePassword);

//request to reset password
router.post('/api/v1/account/request-reset-password', accountController.requestToResetPassword);

//reset password
router.post('/api/v1/account/reset-password', accountController.resetPassword);

module.exports = router;