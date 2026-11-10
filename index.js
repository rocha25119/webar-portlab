const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET /api/v1/zonas -> Listado de las 6 zonas (consumido por WebAR)
app.get('/api/v1/zonas', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tb_zonas ORDER BY id_zona ASC');
    res.json(rows);
  } catch (err) {
    console.error('Error al consultar zonas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/v1/zonas/:codigo -> Detalle de una cápsula específica
app.get('/api/v1/zonas/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  try {
    const { rows } = await pool.query('SELECT * FROM tb_zonas WHERE codigo = $1 LIMIT 1', [codigo]);
    if (rows.length === 0) return res.status(404).json({ error: 'Zona no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al consultar zona:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/v1/zonas/:codigo -> Actualización de la cápsula desde el Panel Admin (OE2)
app.put('/api/v1/zonas/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  const { nombre, tipo_zona, descripcion } = req.body;

  try {
    const query = `
      UPDATE tb_zonas
      SET nombre = COALESCE($1, nombre),
          tipo_zona = COALESCE($2, tipo_zona),
          descripcion = COALESCE($3, descripcion),
          actualizado_en = NOW()
      WHERE codigo = $4
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [nombre, tipo_zona, descripcion, codigo]);
    if (rows.length === 0) return res.status(404).json({ error: 'Zona no encontrada' });

    res.json({ mensaje: 'Cápsula actualizada exitosamente', data: rows[0] });
  } catch (err) {
    console.error('Error al actualizar zona:', err);
    res.status(500).json({ error: 'Error al actualizar base de datos' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor PortLab activo en http://localhost:${PORT}`);
});