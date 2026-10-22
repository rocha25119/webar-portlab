const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Datos oficiales de respaldo de la maqueta física PortLab (FAB INACAP Sede Iquique)
const zonasPortuarias = [
  { 
    id_zona: 1, 
    codigo: 'PIER_03', 
    nombre: 'Sitio de Atraque Pier 3', 
    tipo_zona: 'Muelle Norte', 
    descripcion: 'Frente de atraque marítimo destinado a la descarga de naves portacontenedores y conexión directa a grúas pórtico.' 
  },
  { 
    id_zona: 2, 
    codigo: 'PIER_04', 
    nombre: 'Sitio de Atraque Pier 4', 
    tipo_zona: 'Muelle Sur', 
    descripcion: 'Punto de atraque complementario habilitado para carga general y operaciones auxiliares de transferencia marítima.' 
  },
  { 
    id_zona: 3, 
    codigo: 'ALM_01', 
    nombre: 'Zona A3 (Almacén 1)', 
    tipo_zona: 'Bodega de Acopio', 
    descripcion: 'Zona de recepción temporal y consolidación de carga fiscal asociada a la ruta de despacho diferido.' 
  },
  { 
    id_zona: 4, 
    codigo: 'ALM_02', 
    nombre: 'Zona B4 (Almacén 2)', 
    tipo_zona: 'Patio de Contenedores', 
    descripcion: 'Instalación de almacenamiento secundario y acopio para mercancías de transferencia diferida.' 
  },
  { 
    id_zona: 5, 
    codigo: 'RUTA_DIF', 
    nombre: 'Ruta Diferido (Exportación)', 
    tipo_zona: 'Flujo Logístico', 
    descripcion: 'Trayectoria operativa de carga hacia recintos de depósito previo a la tramitación de aforo y retiro.' 
  },
  { 
    id_zona: 6, 
    codigo: 'RUTA_IND', 
    nombre: 'Ruta Salida (Indirecto / ZOFRI)', 
    tipo_zona: 'Flujo Logístico', 
    descripcion: 'Circuito de transferencia directa intermedia entre el frente de atraque y plataformas terrestres de salida.' 
  }
];

// Configuración de conexión a Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 4000
});

// Ruta raíz
app.get('/', async (req, res) => {
  try {
    const consulta = await pool.query('SELECT * FROM tb_zonas ORDER BY id_zona ASC');
    res.json(consulta.rows);
  } catch (error) {
    console.warn('Usando respaldo local en raíz:', error.message);
    res.json(zonasPortuarias);
  }
});

// Endpoint estándar API REST (RF-06)
app.get('/api/v1/zonas', async (req, res) => {
  try {
    const consulta = await pool.query('SELECT * FROM tb_zonas ORDER BY id_zona ASC');
    res.json(consulta.rows);
  } catch (error) {
    console.warn('Aviso BD (usando respaldo local):', error.message);
    res.json(zonasPortuarias);
  }
});

// Búsqueda por ID numérico o código
app.get('/api/v1/zonas/:id', async (req, res) => {
  const param = req.params.id.trim().toLowerCase();
  try {
    const consulta = await pool.query(
      'SELECT * FROM tb_zonas WHERE LOWER(codigo) = $1 OR id_zona::text = $1 LIMIT 1',
      [param]
    );

    if (consulta.rowCount > 0) {
      return res.json(consulta.rows[0]);
    }
  } catch (error) {
    console.warn('Aviso en búsqueda SQL (usando respaldo local):', error.message);
  }

  // Si falla la BD o no encuentra la fila, busca en el arreglo de respaldo
  const zonaLocal = zonasPortuarias.find(z => 
    z.id_zona.toString() === param || 
    z.codigo.toLowerCase() === param
  );

  if (!zonaLocal) {
    return res.status(404).json({ error: 'Zona portuaria no encontrada en la maqueta' });
  }

  res.json(zonaLocal);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> SERVIDOR PORTLAB ACTIVO EN HTTP://LOCALHOST:${PORT} <<<`);
});
