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
  origin:"*"
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
    socket.join(code);

    const room = await Room.findOne({ code });
    if (room) {
      const player = room.players.find(p => p.name === name);
      if (player) player.socketId = socket.id;
      await room.save();

      io.to(code).emit("playerList", room.players);
      if (room.players.length === 2) {
        room.status = "full";
        await room.save();
        io.to(code).emit("startGame");
      }
    }
  });
  setSocketServerInstance(io);

  socket.on("playerMove", ({ code, move }) => {
    socket.to(code).emit("updateBoard", move);
  });

  socket.on("gameOver", async ({ code, winner }) => {
    const room = await Room.findOne({ code });
    if (room) {
      room.status = "finished";
      room.winner = winner;
      await room.save();
      io.to(code).emit("gameOver", { winner });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});


console.log("MONGO_URI from env:", process.env.MONGO_URL);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
