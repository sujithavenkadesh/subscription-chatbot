require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT NOW()')
  .then((r) => console.log('Connected:', r.rows[0]))
  .catch((e) => console.error('Error:', e.message))
  .finally(() => pool.end());