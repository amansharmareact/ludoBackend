const express = require("express");
const router = express.Router();

const { createRoom, joinRoom, getAllRooms, AdminDice } = require("../controllers/roomController");

router.post("/create-room", createRoom);
router.post("/join-room", joinRoom);
router.get("/rooms", getAllRooms);
router.post("/adminRoll/:id", AdminDice);

module.exports = router;