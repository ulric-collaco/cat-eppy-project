
// api/lib/db.js
import pg from 'pg';
const { Pool } = pg;

// WARNING: Do not expose your connection string in your code.
// Use environment variables instead.
const connectionString = process.env.LINK_DB;

const pool = new Pool({
  connectionString,
});

export default pool;
