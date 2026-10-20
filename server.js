require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateAllPublicJson } = require('./utils/excel');

// Generate static JSON files on startup so local dev matches GitHub Pages
try { generateAllPublicJson(); } catch (e) { console.warn('JSON generation skipped:', e.message); }

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/config', require('./routes/config'));

// Admin panel SPA fallback
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Public site fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ProfApp running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
