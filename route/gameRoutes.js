const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

router.post("/record-move", gameController.recordMove);
router.post("/cut-token", gameController.cutToken);
router.post("/clear-token", gameController.clearToken);
router.get("/:gameId/winner", gameController.getWinner);

module.exports = router;
