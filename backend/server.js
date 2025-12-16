require('dotenv').config();
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Render environments commonly lack IPv6 egress. Supabase hosts may resolve to IPv6,
// which can cause ENETUNREACH. Prefer IPv4 to keep Postgres connectivity stable.
try {
    dns.setDefaultResultOrder('ipv4first');
} catch {
    // No-op for older Node versions
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

const sslConfig = (process.env.PGSSLMODE === 'disable' || process.env.DB_SSL === 'false')
    ? false
    : { rejectUnauthorized: false };

let poolConfig;
if (databaseUrl) {
    poolConfig = {
        connectionString: databaseUrl,
        ssl: sslConfig
    };
    console.log('Database config: using DATABASE_URL');
} else {
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    const missing = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((k) => !process.env[k]);
    if (missing.length) {
        console.error(
            `Database config error: missing ${missing.join(', ')}. ` +
            'On Render, set DATABASE_URL (recommended) to your Supabase Postgres connection string.'
        );
    }

    poolConfig = {
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : undefined,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: sslConfig
    };
    console.log('Database config: using DB_* variables');
}

const pool = new Pool(poolConfig);

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error acquiring client', err);
        return;
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Connected to Database');
    });
});

function isDatabaseUnavailableError(err) {
    return err && (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'EHOSTUNREACH' ||
        err.code === 'ECONNRESET'
    );
}

// API Routes
app.get('/api/services', async (req, res) => {
    const { search } = req.query;
    
    try {
        let query = `
            SELECT sn.id, sn.name, sc.title, sc.description, sc.image_path, sc.details 
            FROM service_names sn 
            JOIN service_content sc ON sn.id = sc.service_id
        `;
        
        const params = [];
        
        if (search) {
            query += ` WHERE sn.name ILIKE $1 OR sc.title ILIKE $1 OR sc.description ILIKE $1`;
            params.push(`%${search}%`);
        }
        
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Error in /api/services', err);
        if (isDatabaseUnavailableError(err)) {
            return res.status(503).json({ error: 'Database unavailable' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
