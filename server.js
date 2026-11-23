const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./src/db');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Pastikan Tabel Database siap (dijalankan sekali per instance)
let dbInitialized = false;
app.use('/api', async (req, res, next) => {
  if (!dbInitialized) {
    await initDB();
    dbInitialized = true;
  }
  next();
});

// 3. Menyajikan file Frontend dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 4. Gunakan Routes API dengan prefix '/api'
app.use('/api', apiRoutes);

// 5. Route Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    message: 'Server Target Belajar Siswa & NeonDB sudah terhubung! 🚀'
  });
});

// 6. Jalankan app.listen hanya jika di lokal (bukan di Vercel Serverless)
if (!process.env.VERCEL) {
  initDB().then(() => {
    dbInitialized = true;
    app.listen(PORT, () => {
      console.log(`✅ Server berjalan di http://localhost:${PORT}`);
    });
  });
}

// 7. Export app agar bisa dijalankan oleh Vercel Serverless
module.exports = app;
