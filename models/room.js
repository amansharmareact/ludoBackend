const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  players: [{ name: String, socketId: String }],
  status: { type: String, enum: ["waiting", "full"], default: "waiting" },
  winner: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
