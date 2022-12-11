const express = require('express');
const accountController = require('../controllers/accountController');
const router = express.Router();

//sign up
router.post('/api/v1/account/sign-up', accountController.signUp);

//sign in
router.post('/api/v1/account/sign-in', accountController.signIn);

module.exports = router;