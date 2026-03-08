const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
    .then(r => { console.log(r.rows); pool.end(); })
    .catch(e => { console.error(e.message); pool.end(); });
