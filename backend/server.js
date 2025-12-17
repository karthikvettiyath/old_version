require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dns = require("dns");

/* =========================
   FORCE IPV4 ONLY (RENDER FIX)
========================= */
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore on older Node versions
}

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

function stripSurroundingQuotes(value) {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

const DATABASE_URL = stripSurroundingQuotes(process.env.DATABASE_URL);

let pool = null;
let dbHealthy = false;

if (!DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Backend will start, but /api/services will return 503 until a database is configured."
  );
} else {
  // Safe diagnostics (does NOT log password)
  try {
    const parsed = new URL(DATABASE_URL);
    console.log(
      `🔎 DB target: ${parsed.username || "(none)"}@${parsed.host || "(none)"}${parsed.pathname || ""}`
    );
    if (parsed.port === "5432" && parsed.hostname.startsWith("db.")) {
      console.warn(
        "⚠️  You are using the direct Supabase DB host on port 5432. On Render this can fail due to IPv6 routing. Prefer the Supabase pooler URL (port 6543)."
      );
    }
  } catch {
    console.warn(
      "⚠️  DATABASE_URL is not a valid URL. Backend will start, but /api/services will return 503 until DATABASE_URL is fixed."
    );
  }

  /* =========================
     FORCE IPV4 IN PG
  ========================= */
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // 👇 THIS IS THE KEY LINE
    family: 4, // force IPv4, block IPv6
  });
}

/* =========================
   TEST DB CONNECTION
========================= */
(async () => {
  if (!pool) return;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbHealthy = true;
    console.log("✅ Connected to Supabase Database (IPv4)");
  } catch (err) {
    dbHealthy = false;
    console.error("❌ Database connection failed:", err);
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
    if (!pool || !dbHealthy) {
      return res.status(503).json({ error: "Database unavailable" });
    }

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
    dbHealthy = true;
    res.json(rows);
  } catch (err) {
    console.error("❌ /api/services error:", err);
    const code = err?.code;
    if (code === "ENETUNREACH" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      dbHealthy = false;
      return res.status(503).json({ error: "Database unavailable" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
