require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

pool.query(sql)
  .then(() => console.log('Tables created and sample data added'))
  .catch((e) => console.error('Error:', e.message))
  .finally(() => pool.end());