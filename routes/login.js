const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === "admin" && password === "admin123") {
        const token = jwt.sign({ role: 'admin' }, 'YOUR_SECRET_KEY', { expiresIn: '1d' });
        return res.json({ token });
    }
    
    res.status(401).json({ message: "Invalid credentials" });
});