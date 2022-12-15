const express = require('express');
const testController = require('../controllers/testController');
const router = express.Router();

router.post('/api/v1/test', testController.sendMessageToSenser);

module.exports = router;
