const express = require("express");
const balconyController = require("../controllers/balconyController");
const router = express.Router();

//create new balcony
router.post("/api/v1/balcony/create", balconyController.createBalcony);

//get all balconies
router.get("/api/v1/balcony/find", balconyController.find)

module.exports = router;
