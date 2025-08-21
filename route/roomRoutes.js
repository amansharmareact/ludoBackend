const express = require("express");
const router = express.Router();

const { createRoom, joinRoom, getAllRooms } = require("../controllers/roomController");

router.post("/create-room", createRoom);
router.post("/join-room", joinRoom);
router.get("/rooms", getAllRooms);

module.exports = router;