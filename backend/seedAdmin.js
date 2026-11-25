
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const createAdmin = async () => {
  const ADMIN_EMAIL = "kamalayush65@gmail.com";
  const ADMIN_PASSWORD = "Ayush@123";
  const ADMIN_NAME = "System Admin";

  console.log("Connecting to MongoDB...");

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 20000,
  });

  console.log("MongoDB connected!");

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    console.log(`\n✅ Admin already exists:`);
    console.log(`   Email    : ${ADMIN_EMAIL}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: "admin",
  });

  console.log(`\n✅ Admin created successfully!`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`\nLogin at: http://localhost:5173/login`);

  await mongoose.disconnect();
};

createAdmin().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  console.error("Check your MONGO_URI in .env and ensure network access to MongoDB Atlas.");
  process.exit(1);
});

