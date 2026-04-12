const express = require("express");
const router  = express.Router();
const db      = require("../config/db"); // ndrysho me path-in e saktë të lidhjes tënde

/**
 * GET /api/search
 * Parametrat: q, vin, id, type, category, fuel, transmission,
 *             color, seats, status, year_min, year_max, price_min, price_max
 */
router.get("/", async (req, res) => {
  try {
    const {
      q, type, category, fuel, transmission,
      color, seats, year_min, year_max,
      price_min, price_max, vin, id, status,
    } = req.query;

    const conditions = [];
    const params     = [];

    if (q?.trim()) {
      conditions.push("(c.brand LIKE ? OR c.model LIKE ?)");
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }
    if (id)           { conditions.push("c.id = ?");           params.push(Number(id)); }
    if (vin)          { conditions.push("c.vin = ?");          params.push(vin.trim().toUpperCase()); }
    if (type)         { conditions.push("c.type = ?");         params.push(type.toUpperCase()); }
    if (category)     { conditions.push("c.category = ?");     params.push(category); }
    if (fuel)         { conditions.push("c.fuel = ?");         params.push(fuel); }
    if (transmission) { conditions.push("c.transmission = ?"); params.push(transmission); }
    if (color)        { conditions.push("c.color = ?");        params.push(color); }
    if (seats)        { conditions.push("c.seats = ?");        params.push(Number(seats)); }
    if (status)       { conditions.push("c.status = ?");       params.push(status); }
    if (year_min)     { conditions.push("c.year >= ?");        params.push(Number(year_min)); }
    if (year_max)     { conditions.push("c.year <= ?");        params.push(Number(year_max)); }
    if (price_min) {
      conditions.push("(c.price_per_day >= ? OR c.sale_price >= ?)");
      params.push(Number(price_min), Number(price_min));
    }
    if (price_max) {
      conditions.push("((c.price_per_day > 0 AND c.price_per_day <= ?) OR (c.sale_price > 0 AND c.sale_price <= ?))");
      params.push(Number(price_max), Number(price_max));
    }

    const WHERE = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT
        c.id, c.type, c.brand, c.model, c.vin,
        c.category, c.year, c.fuel, c.transmission,
        c.color, c.seats, c.price_per_day, c.sale_price,
        c.status, c.created_at,
        MIN(m.image_path) AS image
      FROM cars c
      LEFT JOIN media m ON m.car_id = c.id
      ${WHERE}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 60
    `;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, total: rows.length, results: rows });

  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;