const express = require("express");
const router = express.Router();
const { registerAdmin, loginAdmin } = require("../controllers/adminController");

router.post("/register-admin", registerAdmin); // Only for first-time setup
router.post("/login-admin", loginAdmin);

module.exports = router;
