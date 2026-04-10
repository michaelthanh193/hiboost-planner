const express = require('express');
const cors = require('cors');
const path = require('path');
const { calculatePlan } = require('./engine/nutrition');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── API ROUTES ───────────────────────────────────────────────────────────────

/**
 * POST /api/plan
 * Body: { sport, durationHrs, bodyWeightKg, sweatLevel, saltiness, temperature, experience }
 * Returns: full nutrition plan with timeline + product recommendations
 */
app.post('/api/plan', (req, res) => {
  try {
    const input = req.body;

    // Validate required fields
    const required = ['sport', 'durationHrs', 'bodyWeightKg'];
    for (const field of required) {
      if (input[field] === undefined || input[field] === null) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate ranges
    if (input.durationHrs < 0.25 || input.durationHrs > 24) {
      return res.status(400).json({ error: 'durationHrs must be between 0.25 and 24' });
    }
    if (input.bodyWeightKg < 30 || input.bodyWeightKg > 200) {
      return res.status(400).json({ error: 'bodyWeightKg must be between 30 and 200' });
    }

    const plan = calculatePlan(input);
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Plan calculation error:', err);
    res.status(500).json({ error: 'Calculation failed', details: err.message });
  }
});

/**
 * GET /api/sports
 * Returns list of supported sports
 */
app.get('/api/sports', (req, res) => {
  const { SPORTS } = require('./engine/nutrition');
  res.json(Object.entries(SPORTS).map(([id, data]) => ({ id, label: data.label })));
});

/**
 * GET /api/products
 * Returns HiBoost product catalog
 */
app.get('/api/products', (req, res) => {
  const { HIBOOST_PRODUCTS } = require('./engine/nutrition');
  res.json(HIBOOST_PRODUCTS);
});

/**
 * Route /api/lead handling for local dev
 */
app.all('/api/lead', async (req, res) => {
  const leadHandler = require('../api/lead');
  await leadHandler(req, res);
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'HiBoost Nutrition API' }));

// ─── SERVE REACT BUILD (production) ──────────────────────────────────────────
const distPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log(`   Serving frontend from: ${distPath}`);
}

app.listen(PORT, () => {
  console.log(`\n🥤 HiBoost Nutrition API running on http://localhost:${PORT}`);
  console.log(`   POST /api/plan     — generate a nutrition plan`);
  console.log(`   GET  /api/sports   — list supported sports`);
  console.log(`   GET  /api/products — HiBoost product catalog\n`);
});

module.exports = app;
