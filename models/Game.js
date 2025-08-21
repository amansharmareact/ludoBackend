const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: String,
  score: { type: Number, default: 0 }
});

const gameSchema = new mongoose.Schema({
  roomCode: String,
  players: [playerSchema],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Game", gameSchema);
