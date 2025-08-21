const Game = require("../models/game");

// Increment points for a move
exports.recordMove = async (req, res) => {
  try {
    const { gameId, playerName } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const player = game.players.find(p => p.name === playerName);
    if (!player) return res.status(404).json({ message: "Player not found" });

    player.score += 10; // move = +10
    await game.save();

    res.json({ success: true, score: player.score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Deduct points for cutting token
exports.cutToken = async (req, res) => {
  try {
    const { gameId, playerName } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const player = game.players.find(p => p.name === playerName);
    if (!player) return res.status(404).json({ message: "Player not found" });

    player.score -= 100; // cutting token = -100
    await game.save();

    res.json({ success: true, score: player.score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add points for clearing a token
exports.clearToken = async (req, res) => {
  try {
    const { gameId, playerName } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const player = game.players.find(p => p.name === playerName);
    if (!player) return res.status(404).json({ message: "Player not found" });

    player.score += 50; // clearing token = +50
    await game.save();

    res.json({ success: true, score: player.score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Determine winner
exports.getWinner = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const winner = game.players.reduce((prev, curr) => 
      prev.score > curr.score ? prev : curr
    );

    res.json({ success: true, winner });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
