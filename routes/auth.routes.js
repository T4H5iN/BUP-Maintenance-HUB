const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const router = express.Router();
const SECRET_KEY = "your_jwt_secret";
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ message: "Email already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ role, email, dept, password: hashedPassword });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: "Incorrect password" });
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        res.json({
            token,
            user: { id: user._id, role: user.role, email: user.email, dept: user.dept },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "No token provided" });
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
});
module.exports = router;
