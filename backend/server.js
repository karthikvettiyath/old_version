require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dns = require("dns");

/* =========================
   FORCE IPV4 ONLY (RENDER FIX)
========================= */
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

/* =========================
   FORCE IPV4 IN PG
========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // 👇 THIS IS THE KEY LINE
  family: 4, // force IPv4, block IPv6
});

/* =========================
   TEST DB CONNECTION
========================= */
(async () => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ Connected to Supabase Database (IPv4)");
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

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/services error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
