const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// SIGNUP
// SIGNUP ROUTE
// routes/auth.js

router.post("/signup", async (req, res) => {
  try {
    // Frontend se 'firstName', 'lastName', 'phone' aa raha hai
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Naya user banate waqt fields ka dhyan rakhein
    const newUser = new User({
      name: `${firstName} ${lastName}`, // Full name banane ke liye
      email,
      phone,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "Account created!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login1", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

   res.status(200).json({
  success: true,
  message: "Login successful",
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  }
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;