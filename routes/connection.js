const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = require('../config/dbConfig');

router.get('/connection', async (req, res) => {
  try {
    await sql.connect(config);
    await sql.close();

    res.json({ success: true, message: 'Database connection successful!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed.', error: error.message });
  }
});

module.exports = router;
