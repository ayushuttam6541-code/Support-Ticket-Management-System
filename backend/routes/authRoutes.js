

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

// One-time admin setup endpoint (safe — won't create if admin already exists)
router.post("/setup-admin", async (req, res) => {
  try {
    const ADMIN_EMAIL    = "admin@helpdesk.com";
    const ADMIN_PASSWORD = "admin1234";

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Admin already exists. Use these credentials to login.",
        credentials: { email: ADMIN_EMAIL, note: "Use the password you set during seed" }
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
