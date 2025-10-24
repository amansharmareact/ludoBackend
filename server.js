require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const adminRoutes = require("./route/adminRoutes");

const roomRoutes = require("./route/roomRoutes");
const Room = require("./models/room");
const { setSocketServerInstance } = require("./controllers/roomController");

const app = express();
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", adminRoutes);
app.use("/api", roomRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error(err));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on("joinRoom", async ({ code, name }) => {
    try {
      console.log(`👤 ${name} attempting to join room ${code}`);

      socket.join(code);

      const room = await Room.findOne({ code });
      if (!room) {
        socket.emit("roomError", { message: "Room not found" });
        return;
      }

      const player = room.players.find(p => p.name === name);
      if (!player) {
        socket.emit("roomError", { message: "Player not found in room" });
        return;
      }

      // Update player's socket ID
      player.socketId = socket.id;
      await room.save();

      // Notify all players in room
      socket.to(code).emit("playerJoined", { player: name, players: room.players });
      socket.emit("playerJoined", { player: name, players: room.players });

      // Send current player list
      io.to(code).emit("playerList", room.players);

      // Check if room is full and start game
      if (room.players.length >= 2 && room.status !== "full") {
        room.status = "full";
        await room.save();

        console.log(`🏠 Room ${code} is now full, starting game`);
        io.to(code).emit("roomFull", { players: room.players });
        io.to(code).emit("gameStarted", { players: room.players });
      }

      console.log(`✅ ${name} successfully joined room ${code}`);

    } catch (error) {
      console.error(`❌ Error joining room ${code}:`, error);
      socket.emit("roomError", { message: "Failed to join room" });
    }
  });
  setSocketServerInstance(io);

  // Handle dice rolls
  socket.on("rollDice", ({ roomCode, player, diceValue }) => {
    console.log(`🎲 ${player} rolled ${diceValue} in room ${roomCode}`);
    // Broadcast to all players in the room
    io.to(roomCode).emit("diceRolled", { player, diceValue });
  });

  // Handle piece movements
  socket.on("movePiece", ({ roomCode, player, pieceId, fromPosition, toPosition, travelCount }) => {
    console.log(`♟️ ${player} moved piece ${pieceId} from ${fromPosition} to ${toPosition}`);
    // Broadcast to all players in the room
    io.to(roomCode).emit("pieceMoved", {
      player,
      pieceId,
      fromPosition,
      toPosition,
      travelCount
    });
  });

  // Handle pieces moving from home
  socket.on("movePieceFromHome", ({ roomCode, player, pieceId, startingPosition }) => {
    console.log(`🏠 ${player} moved piece ${pieceId} from home to ${startingPosition}`);
    // Broadcast to all players in the room
    io.to(roomCode).emit("pieceMovedFromHome", {
      player,
      pieceId,
      startingPosition
    });
  });

  // Handle turn changes
  socket.on("changeTurn", ({ roomCode, currentPlayer, nextPlayer }) => {
    console.log(`🔄 Turn changed from ${currentPlayer} to ${nextPlayer} in room ${roomCode}`);
    // Broadcast to all players in the room
    io.to(roomCode).emit("turnChanged", {
      currentPlayer,
      nextPlayer
    });
  });

  // Keep existing playerMove for backward compatibility
  socket.on("playerMove", ({ code, move }) => {
    socket.to(code).emit("updateBoard", move);
  });

  // Enhanced gameOver handler
  socket.on("gameOver", async ({ roomCode, winner, gameEndReason }) => {
    console.log(`🎯 Game over in room ${roomCode}: ${winner} wins (${gameEndReason})`);

    const room = await Room.findOne({ code: roomCode });
    if (room) {
      room.status = "finished";
      room.winner = winner;
      await room.save();

      // Broadcast to all players in the room
      io.to(roomCode).emit("gameOver", {
        winner,
        gameEndReason: gameEndReason || 'victory'
      });
    }
  });

  socket.on("disconnect", async () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    try {
      // Find the room and player associated with this socket
      const room = await Room.findOne({
        "players.socketId": socket.id
      });

      if (room) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          console.log(`👋 ${player.name} left room ${room.code}`);

          // Clear the socket ID but keep the player in the room
          // This allows them to reconnect
          player.socketId = null;
          await room.save();

          // Notify other players
          socket.to(room.code).emit("playerLeft", {
            player: player.name,
            players: room.players
          });
        }
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});


console.log("MONGO_URI from env:", process.env.MONGO_URL);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
