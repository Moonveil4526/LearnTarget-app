const express = require('express');
const router = express.Router();
const { pool } = require('./db');


router.get('/targets', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM study_targets';
    const values = [];
    const conditions = [];

    
    if (status && status !== 'Semua') {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    
    if (search && search.trim() !== '') {
      values.push(`%${search.trim()}%`);
      conditions.push(`(title ILIKE $${values.length} OR subject ILIKE $${values.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error GET /targets:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data target belajar' });
  }
});


router.post('/targets', async (req, res) => {
  try {
    const { title, subject, priority, status, target_date, notes } = req.body;

    
    if (!title || !subject) {
      return res.status(400).json({ error: 'Judul dan Mata Pelajaran wajib diisi!' });
    }

    const insertQuery = `
      INSERT INTO study_targets (title, subject, priority, status, target_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      title.trim(),
      subject.trim(),
      priority || 'Medium',
      status || 'Belum Mulai',
      target_date || null,
      notes || ''
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error POST /targets:', error.message);
    res.status(500).json({ error: 'Gagal menambahkan target belajar' });
  }
});


router.put('/targets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, priority, status, target_date, notes } = req.body;

    const updateQuery = `
      UPDATE study_targets
      SET title = $1, subject = $2, priority = $3, status = $4, target_date = $5, notes = $6
      WHERE id = $7
      RETURNING *;
    `;
    const values = [title, subject, priority, status, target_date || null, notes || '', id];

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target belajar tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error PUT /targets/:id:', error.message);
    res.status(500).json({ error: 'Gagal mengupdate target belajar' });
  }
});


router.patch('/targets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE study_targets SET status = $1 WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target belajar tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error PATCH /targets/:id/status:', error.message);
    res.status(500).json({ error: 'Gagal mengubah status target belajar' });
  }
});


router.delete('/targets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM study_targets WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target belajar tidak ditemukan' });
    }

    res.json({ message: 'Target belajar berhasil dihapus', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error DELETE /targets/:id:', error.message);
    res.status(500).json({ error: 'Gagal menghapus target belajar' });
  }
});

module.exports = router;
