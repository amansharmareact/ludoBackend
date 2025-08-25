const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Create first admin (run only once)
exports.registerAdmin = async (req, res) => {

  try {
    const { email, password,role="admin"} = req.body;
    let existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Admin already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ email, password: hashedPassword,role:role });
    await admin.save();

    res.json({ success: true, message: "Admin registered" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Login admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token,role:admin.role });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
