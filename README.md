# 🥤 HiBoost Nutrition Planner

A **full-stack web application** for generating personalized race-day nutrition and hydration plans for endurance athletes. Inspired by [Precision Hydration's planner](https://www.precisionhydration.com/planner/), built for [HiBoost Nutrition](https://www.hiboostnutrition.com).

## Features

✅ **Multi-step form wizard** — Sport → Event details → Body metrics → Sweat profile
✅ **Science-based calculation engine** — Based on ACSM & ISSN sports nutrition guidelines
✅ **Personalized race timeline** — Hour-by-hour fueling and hydration checkpoints
✅ **HiBoost product recommendations** — Matched to your calculated needs (HIGH5, Maurten, ADAPTED)
✅ **Responsive React UI** — Modern, accessible design with real-time validation
✅ **RESTful Node.js API** — Easy to extend, integrate, or deploy

## What It Does

1. **Collects athlete data**: sport, event duration, body weight, sweat rate, saltiness, temperature
2. **Calculates nutrition targets** using allometric scaling and sports science formulas:
   - **Carbohydrates per hour** (30–90g depending on effort duration)
   - **Sodium per hour** (300–700mg based on sweat rate & saltiness)
   - **Fluids per hour** (400–1000ml to replace 70–80% of sweat losses)
3. **Generates race timeline** with 15–30 min checkpoints and specific intake guidance
4. **Recommends HiBoost products** (HIGH5 gels, ADAPTED electrolytes, Maurten drink mix) matched to calculated needs
5. **Provides science-backed tips** for gut training, heat adaptation, carb-loading, etc.

## Tech Stack

**Backend**
- Node.js + Express
- Custom sports nutrition calculation engine
- CORS-enabled REST API

**Frontend**
- React 18 + Vite
- Tailwind-like inline CSS styling
- Multi-step form wizard with real-time validation
- Responsive grid layouts

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone or navigate to the project
cd hiboost-planner

# Install all dependencies
npm install

# This installs dependencies for both server/ and client/ directories
```

### Running the App

**Development mode** (both server and client with hot-reload):
```bash
npm run dev:all
```

This will:
- Start the API server on `http://localhost:3001`
- Start the React dev server on `http://localhost:3000`

**Server only** (for API testing):
```bash
npm run dev:server
```

**Client only** (requires API on 3001):
```bash
npm run dev:client
```

### API Endpoints

#### `POST /api/plan`
Generate a personalized nutrition plan.

**Request body:**
```json
{
  "sport": "running",
  "durationHrs": 2.0,
  "bodyWeightKg": 70,
  "sweatLevel": "medium",
  "saltiness": "medium",
  "temperature": "warm",
  "experience": "intermediate"
}
```

**Response:**
```json
{
  "success": true,
  "plan": {
    "meta": { "sport": "Running", "durationHrs": 2, ... },
    "perHour": { "carbsG": 45, "sodiumMg": 931, "fluidMl": 776 },
    "totals": { "carbsG": 90, "sodiumMg": 1862, "fluidMl": 1552 },
    "sweatRatePerHr": 1034,
    "timeline": [ { "timeMin": 0, "label": "Race Start", ... }, ... ],
    "products": [ { "id": "high5-gel", "name": "HIGH5 Energy Gel", "quantity": 4, ... }, ... ],
    "tips": [ "High carb target: train your gut...", ... ]
  }
}
```

#### `GET /api/sports`
List supported sports.

#### `GET /api/products`
Return full HiBoost product catalog.

#### `GET /health`
Health check endpoint.

## Project Structure

```
hiboost-planner/
├── server/
│   ├── index.js              # Express API server
│   ├── engine/
│   │   └── nutrition.js      # Core calculation logic & formulas
│   ├── package.json
│   └── node_modules/
│
├── client/
│   ├── index.html            # Entry HTML
│   ├── vite.config.js        # Vite config with API proxy
│   ├── src/
│   │   ├── main.jsx          # React app entry
│   │   ├── App.jsx           # Main app component (progress bar, step routing)
│   │   └── components/
│   │       ├── StepSport.jsx     # Sport selection
│   │       ├── StepEvent.jsx     # Event details (distance/duration)
│   │       ├── StepBody.jsx      # Body metrics (weight, experience)
│   │       ├── StepSweat.jsx     # Sweat profile (sweat rate, saltiness, temp)
│   │       └── Results.jsx       # Full results page with timeline & products
│   ├── package.json
│   └── node_modules/
│
├── package.json              # Root: runs both server & client
├── README.md                 # This file
└── node_modules/
```

## How the Calculation Works

### 1. **Carbohydrate Targets** (g/hr)

Based on event duration and adjusted for body weight:

| Duration | Base Target | Notes |
|----------|------------|-------|
| < 45 min | 0g | No carbs needed |
| ~1 hour | 30g | Single carb source |
| ~1.5–2 hours | 45–60g | Mix glucose + fructose |
| ~2.5–3.5 hours | 75g | Dual-carb formula for better absorption |
| 3.5+ hours | 90g | Endurance carb loading |

**Weight adjustment:** `base × (bodyWeight/70)^0.75` — accounts for metabolic scaling

### 2. **Sweat Rate** (ml/hr)

Base rates by self-reported sweat level:
- **Light sweater**: ~500 ml/hr
- **Moderate sweater**: ~900 ml/hr
- **Heavy sweater**: ~1400 ml/hr
- **Extreme sweater**: ~1800 ml/hr

Adjusted for:
- **Sport type** (running = 1.0×, cycling = 0.85×, swimming = 0.7×)
- **Temperature** (cold = -20%, hot = +30%, very hot = +50%)

### 3. **Sodium Targets** (mg/hr)

Calculated from sweat rate × sweat saltiness:

```
Sodium/hr = (Sweat Rate / 1000) × Sodium Concentration
```

Where concentration is based on reported saltiness:
- **Low**: 600 mg/L
- **Medium**: 900 mg/L
- **High**: 1200 mg/L
- **Very high**: 1500 mg/L

### 4. **Fluid Targets** (ml/hr)

Replacement strategy: 70–80% of sweat losses to avoid over-hydration:

```
Fluid/hr = Sweat Rate × 0.75
```

## Product Recommendations

The engine matches calculated needs to real HiBoost catalog products:

- **Carbs**: HIGH5 Energy Gel (23g), HIGH5 Energy Drink (47g in 500ml)
- **Electrolytes**: ADAPTED Hi-Lyte Salt Capsules (400mg sodium each)
- **Combined**: Maurten Drink Mix 320 (80g carb + 500mg sodium per 500ml)
- **Bundles**: Pre-built race combos for 21km and 42km

Each recommendation includes:
- Product link to HiBoost shop
- Quantity needed
- Usage instructions
- Price in VND (Vietnamese) and USD

## Science Basis

This planner follows guidelines from:
- **ACSM** (American College of Sports Medicine) — Hydration & fueling
- **ISSN** (International Society of Sports Nutrition) — Carb & electrolyte targets
- **Precision Hydration research** — Personalized sweat rate & sodium scaling
- **Sports science literature** — Gut training, multiple transportable carbs, heat adaptation

## Extending the App

### Add a new sport
Edit `server/engine/nutrition.js`:
```javascript
const SPORTS = {
  rowing: { sweatMultiplier: 1.1, carbMultiplier: 1.0, label: 'Rowing' },
  // ...
};
```

### Add HiBoost products
Edit the `HIBOOST_PRODUCTS` array in `server/engine/nutrition.js`:
```javascript
{
  id: 'new-product',
  name: 'Product Name',
  type: 'carb',
  carbsG: 25,
  sodiumMg: 100,
  priceVND: 50000,
  url: 'https://...',
}
```

### Deploy to production
```bash
# Build React app
npm run build

# Serve from Express (configure server/index.js to serve client/dist/)
# Then deploy server/ directory to Heroku, Vercel, AWS, etc.
```

## Disclaimer

⚠️ This planner generates recommendations based on population-average sports science formulas. Individual needs vary significantly. **Always test your nutrition strategy in training before race day.** For medical concerns or high-performance guidance, consult a sports dietitian or sports medicine physician.

## License

Built for HiBoost Nutrition. Feel free to adapt and extend for your own use.

## Support

For issues, feature requests, or questions about the science:
- Contact HiBoost Nutrition: https://www.hiboostnutrition.com
- Research reference: Precision Hydration https://www.precisionhydration.com

---

**Made with ⚡ for endurance athletes everywhere.**
