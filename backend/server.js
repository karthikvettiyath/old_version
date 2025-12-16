require("dotenv").config();
const dns = require("dns");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

/* =========================
   FORCE IPV4 (CRITICAL)
========================= */
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONFIG
========================= */
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* =========================
   TEST DB CONNECTION
========================= */
(async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connected to Supabase Database");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api/services", async (req, res) => {
  const { search } = req.query;

  try {
    let query = `
      SELECT
        sn.id,
        sn.name,
        sc.title,
        sc.description,
        sc.image_path,
        sc.details
      FROM service_names sn
      JOIN service_content sc
        ON sn.id = sc.service_id
    `;

    const values = [];

    if (search) {
      query += `
        WHERE sn.name ILIKE $1
           OR sc.title ILIKE $1
           OR sc.description ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in /api/services:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
