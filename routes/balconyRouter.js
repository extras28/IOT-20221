const express = require("express");
const balconyController = require("../controllers/balconyController");
const router = express.Router();

//create new balcony
router.post("/api/v1/balcony/create", balconyController.createBalcony);

//get all balconies
router.get("/api/v1/balcony/find", balconyController.find);

//detail
router.get("/api/v1/balcony/detail", balconyController.detail);

//update
router.put("/api/v1/balcony/update", balconyController.update);

//delete
router.delete("/api/v1/balcony/delete", balconyController.delete);

module.exports = router;
