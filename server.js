const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./src/db');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Menyajikan file Frontenddari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

//Gunakan Routes API dengan prefix '/api'
app.use('/api', apiRoutes);

//Route Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server Target Belajar Siswa & NeonDB sudah terhubung! 🚀'
  });
});

// Inisialisasi Database lalu jalankan Server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  });
});
