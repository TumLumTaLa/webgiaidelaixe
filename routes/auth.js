
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = user;
    res.json({ message: 'Logged in' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
