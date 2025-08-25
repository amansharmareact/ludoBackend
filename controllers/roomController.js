import Room from "../models/room.js";
let io;
export const setSocketServerInstance = (ioInstance) => {
  io = ioInstance;
};
// Create Room API
export const createRoom = async (req, res) => {
  try {
    const { code } = req.body;
    // Check if room already exists
    const existingRoom = await Room.findOne({ code });
    if (existingRoom) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Room with this code already exists",
        });
    }

    // Create new room
    const room = new Room({ code, players: [], status: "waiting" });
    await room.save();

    res.json({ success: true, roomCode: code, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Join room (Player)
export const joinRoom = async (req, res) => {
  try {
    const { code, playerId } = req.body;

    const room = await Room.findOne({ code });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const playerExists = room.players.some(p => p.name === playerId);
    if (playerExists) {
      return res
        .status(400)
        .json({ success: false, message: "Player already in room" });
    }

    if (!playerId || playerId.trim().length < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Player name required" });
    }
     if (room.players.length === 2) {
        return res
        .status(400)
        .json({ success: false, message: "Room is Full" });
    }


    // ✅ Add player
    room.players.push({ name: playerId });

    if (room.players.length === 2) {
      room.status = "full";
    }

    await room.save(); // save changes
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


export  const AdminDice = async (req, res) => {
  try {
    const { id:roomId } = req.params;
    const { player, number } = req.body;

    console.log(roomId,player,number)

    // 1. Find room
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

   

    // // 3. Emit real-time event to all in this room
    io.to(room.code).emit("diceRolled", {
      player,
      number,
      roomId,
    });

    return res.json({ success: true, player, number });
  } catch (err) {
    console.error("AdminDice Error:", err);
    res.status(500).json({ message: "Internal server error" });
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
