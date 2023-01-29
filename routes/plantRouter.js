const express = require("express");
const plantController = require("../controllers/plantController");
const router = express.Router();

// create plant
router.post("/api/v1/plant/create", plantController.create);

// control
router.post("/api/v1/plant/control", plantController.control);

//detail
router.get("/api/v1/plant/detail", plantController.detail);

// toggle auto mode
router.post("/api/v1/plant/auto-mode", plantController.toggleAutoMode);

//set breakpoint
router.post("/api/v1/plant/breakpoint", plantController.setBreakpoint);

//find all
router.get("/api/v1/plant/find", plantController.find);

module.exports = router;
