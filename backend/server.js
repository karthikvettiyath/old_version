require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        }
        : {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: {
                rejectUnauthorized: false // Required for Supabase connection
            }
        }
);

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Connected to Database');
    });
});

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
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
