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
    if (!pool) {
      return res.status(503).json({ error: "Database unavailable (No Pool)" });
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

    // If search is provided, filter. If NOT provided, return ALL services (useful for Admin).
    if (search) {
      query += `
        WHERE sn.name ILIKE $1
           OR sc.title ILIKE $1
           OR sc.description ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    query += ` ORDER BY sn.id ASC`; // Consistent ordering

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

// Update service content
app.put("/api/services/:id", async (req, res) => {
  const { id } = req.params;
  const { name, title, description, details } = req.body;

  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update service name
      if (name) {
        await client.query("UPDATE service_names SET name = $1 WHERE id = $2", [name, id]);
      }

      // Update service content
      // Note: This updates the content associated with the service_id.
      // Assuming 1-to-1 mapping for simplicity based on the GET query.
      await client.query(
        `UPDATE service_content 
         SET title = COALESCE($1, title), 
             description = COALESCE($2, description), 
             details = COALESCE($3, details) 
         WHERE service_id = $4`,
        [title, description, details, id]
      );

      await client.query("COMMIT");
      res.json({ success: true, message: "Service updated successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ /api/services/:id update error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
