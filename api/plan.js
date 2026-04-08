// Vercel Serverless Function — POST /api/plan
// Replaces Express server/index.js for production deployment on Vercel.
// The nutrition engine (server/engine/nutrition.js) is reused unchanged.

const { calculatePlan } = require('../server/engine/nutrition');

module.exports = async function handler(req, res) {
  // CORS headers — allow all origins (or lock to your domain in production)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const input = req.body;

    // Validate required fields
    const required = ['sport', 'durationHrs', 'bodyWeightKg'];
    for (const field of required) {
      if (input[field] === undefined || input[field] === null || input[field] === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Validate ranges
    const dur = parseFloat(input.durationHrs);
    const wt  = parseFloat(input.bodyWeightKg);
    if (isNaN(dur) || dur < 0.25 || dur > 36) {
      return res.status(400).json({ error: 'durationHrs must be between 0.25 and 36' });
    }
    if (isNaN(wt) || wt < 30 || wt > 200) {
      return res.status(400).json({ error: 'bodyWeightKg must be between 30 and 200' });
    }

    const plan = calculatePlan({
      ...input,
      durationHrs:  dur,
      bodyWeightKg: wt,
      age:          parseInt(input.age) || 30,
      sweatRateMlHr:  input.sweatRateMlHr  ? parseFloat(input.sweatRateMlHr)  : null,
      sweatSodiumMgL: input.sweatSodiumMgL ? parseFloat(input.sweatSodiumMgL) : null,
    });

    return res.status(200).json({ success: true, plan });
  } catch (err) {
    console.error('[/api/plan] Error:', err.message);
    return res.status(500).json({ error: 'Calculation failed', details: err.message });
  }
};
