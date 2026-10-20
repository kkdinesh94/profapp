const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getSheetNames, readSheet, updateRow, addRow, deleteRow, PUBLIC_SHEETS } = require('../utils/excel');

// GET list of sheets (public: only public sheets; admin: all)
router.get('/sheets', (req, res) => {
  try {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    let isAdmin = false;
    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET);
      isAdmin = true;
    } catch {}
    const names = getSheetNames();
    res.json({ sheets: isAdmin ? names : names.filter(n => PUBLIC_SHEETS.includes(n)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sheet data — public sheets accessible without auth
router.get('/:sheet', (req, res) => {
  const sheetName = decodeURIComponent(req.params.sheet);
  const isPublic = PUBLIC_SHEETS.includes(sheetName);

  if (!isPublic) {
    const token = (req.headers['authorization'] || '').replace('Bearer ', '');
    try {
      const jwt = require('jsonwebtoken');
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Authentication required for this sheet' });
    }
  }

  try {
    const data = readSheet(sheetName);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST — add a row (admin only)
router.post('/:sheet', authMiddleware, (req, res) => {
  const sheetName = decodeURIComponent(req.params.sheet);
  try {
    const newIndex = addRow(sheetName, req.body);
    res.json({ success: true, rowIndex: newIndex });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — update a row by UUID (admin only)
router.put('/:sheet/:id', authMiddleware, (req, res) => {
  const sheetName = decodeURIComponent(req.params.sheet);
  const id = req.params.id;
  try {
    updateRow(sheetName, id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE — remove a row by UUID (admin only)
router.delete('/:sheet/:id', authMiddleware, (req, res) => {
  const sheetName = decodeURIComponent(req.params.sheet);
  const id = req.params.id;
  try {
    deleteRow(sheetName, id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
