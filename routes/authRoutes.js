const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import the User model
const verifyToken = require('../middleware/verifyToken');

const secret = process.env.SECRETKEY;

// Register a new user
router.post(
  "/register",
  async (req, res) => {
    try {

      const { username, password, teamName } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username,
        password: hashedPassword,
        teamName,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while registering user" });
    }
  }
);

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ username, teamName: user.teamName }, secret, {
        expiresIn: "1h",
      });
      res.status(200).json({
        message: "Login successful",
        token,
        user: { username, teamName: user.teamName },
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
    const profileData = {
      username: req.username,
      teamName: req.teamName,
    };
    // console.log('prodil', profileData)
    res.status(200).json(profileData);
});
module.exports = router;
