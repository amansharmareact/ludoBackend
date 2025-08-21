import Room from "../models/room.js";
import Game from "../models/game.js";


// Create Room API
export const createRoom = async (req, res) => {
  try {
    const { code } = req.body;



    // Check if room already exists
    const existingRoom = await Room.findOne({ code });
    if (existingRoom) {
      return res
        .status(400)
        .json({ success: false, message: "Room with this code already exists" });
    }

    // Create new room
    const room = new Room({ code, players: [], status: "waiting" });
    await room.save();

    res.json({ success: true, roomCode: code, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


// Join room (Player)
export const joinRoom = async (req, res) => {
  try {
    const { code, playerId } = req.body;

    const room = await Room.findOne({ code });
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.players.includes(playerId)) {
      return res.status(400).json({ success: false, message: "Player already in room" });
    }

    if (room.players.length >= 2) {
      return res.status(400).json({ success: false, message: "Room is full" });
    }

    room.players.push(playerId);

    // ✅ Mark as full when 2 players join
    if (room.players.length === 2) {
      room.status = "full";
    }

    await room.save();
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};





export const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};