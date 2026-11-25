

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const {
  register,
  login
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

// Get logged-in user's profile
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// One-time admin setup endpoint — protected by ADMIN_SETUP_SECRET
router.post("/setup-admin", async (req, res) => {
  try {
    const { secret } = req.body;

    // Must match env variable
    if (!secret || secret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({
        success: false,
        message: "Invalid setup secret. Access denied."
      });
    }

    const ADMIN_EMAIL    = "kamalayush65@gmail.com";
    const ADMIN_PASSWORD = "Ayush@123";

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Admin already exists.",
        credentials: { email: ADMIN_EMAIL }
      });
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      name: "System Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "admin"
    });

    return res.status(201).json({
      success: true,
      message: "✅ Admin created successfully!",
      credentials: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
