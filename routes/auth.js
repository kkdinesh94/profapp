const express = require('express');
const jwt = require('jsonwebtoken');
const { readSheet } = require('../utils/excel');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required.' });

  // Admin from .env
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign(
      { username, role: 'admin', name: 'Admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return res.json({ token, role: 'admin', name: 'Admin' });
  }

  // Other users (scholars / faculty) from Users sheet in Excel
  try {
    const { rows } = readSheet('Users');
    const user = rows.find(r =>
      String(r['Username'] || '').trim() === username &&
      String(r['Password'] || '').trim() === password
    );
    if (user) {
      const role = String(user['Role'] || 'scholar').toLowerCase().trim();
      const name = String(user['Name'] || username).trim();
      const token = jwt.sign(
        { username, role, name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      return res.json({ token, role, name });
    }
  } catch {
    // Users sheet may not exist yet
  }

  return res.status(401).json({ error: 'Invalid username or password.' });
});

module.exports = router;
