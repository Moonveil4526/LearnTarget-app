const { Pool } = require('pg');
require('dotenv').config();

// 1. Membuat Pool Koneksi ke Neon PostgreSQL menggunakan DATABASE_URL dari file .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Wajib untuk koneksi Cloud PostgreSQL seperti Neon
  }
});

// 2. Fungsi untuk membuat tabel SQL otomatis jika belum ada (Auto-Migration)
const initDB = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS study_targets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      priority VARCHAR(20) DEFAULT 'Medium',
      status VARCHAR(30) DEFAULT 'Belum Mulai',
      target_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('✅ Koneksi ke Neon PostgreSQL berhasil & Tabel "study_targets" siap!');

    // Cek apakah tabel masih kosong, kalau kosong kita isi 2 data contoh (seed) biar pas dibuka gak kosong melompong
    const { rows } = await pool.query('SELECT COUNT(*) FROM study_targets');
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO study_targets (title, subject, priority, status, target_date, notes)
        VALUES 
        ('Menguasai Fundamental Express.js & REST API', 'Web Development', 'High', 'Sedang Dipelajari', CURRENT_DATE + INTERVAL '3 days', 'Membuat endpoint CRUD GET, POST, PUT, DELETE'),
        ('Integrasi PostgreSQL Neon dengan Node.js', 'Database SQL', 'High', 'Selesai', CURRENT_DATE, 'Belajar koneksi Pool menggunakan library pg dan query SQL'),
        ('Desain Responsive Layout dengan Tailwind CSS', 'Frontend UI/UX', 'Medium', 'Belum Mulai', CURRENT_DATE + INTERVAL '7 days', 'Optimasi tampilan Mobile, Tablet, dan Desktop')
      `);
      console.log('🌱 Data contoh awal (seed) berhasil ditambahkan ke NeonDB!');
    }
  } catch (error) {
    console.error('❌ Gagal konek atau membuat tabel di Neon PostgreSQL:', error.message);
  }
};

module.exports = { pool, initDB };
