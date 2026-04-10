/**
 * HiBoost Nutrition Calculation Engine
 * Based on sports science research (ACSM, ISSN guidelines)
 * Mirrors Precision Hydration/Fuel planner logic
 */

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SPORTS = {
  running: { sweatMultiplier: 1.0, carbMultiplier: 1.0, label: 'Running' },
  cycling: { sweatMultiplier: 0.85, carbMultiplier: 0.95, label: 'Cycling' },
  triathlon: { sweatMultiplier: 1.05, carbMultiplier: 1.0, label: 'Triathlon' },
  swimming: { sweatMultiplier: 0.7, carbMultiplier: 0.8, label: 'Swimming' },
  other: { sweatMultiplier: 0.9, carbMultiplier: 0.9, label: 'Other' },
};

// Sweat rate base (ml/hr) by self-reported sweat level
const SWEAT_RATES = {
  low: 500,
  medium: 900,
  high: 1400,
  very_high: 1800,
};

// Sodium concentration in sweat (mg/L) by sweat saltiness
const SODIUM_CONCENTRATION = {
  low: 600,      // ~600mg/L — light salty
  medium: 900,   // ~900mg/L — moderate salty
  high: 1200,    // ~1200mg/L — very salty (white residue)
  very_high: 1500,
};

// Temperature adjustments (% increase to sweat rate)
const TEMP_ADJUSTMENTS = {
  cold: -0.20,    // < 10°C
  cool: -0.10,    // 10–15°C
  mild: 0,        // 15–20°C
  warm: 0.15,     // 20–25°C
  hot: 0.30,      // 25–30°C
  very_hot: 0.50, // > 30°C
};

// Carb targets (g/hr) by duration bracket
function getCarbTarget(durationHrs, bodyWeightKg) {
  let base;
  if (durationHrs <= 0.75) base = 0;         // < 45 min: no carbs needed
  else if (durationHrs <= 1.25) base = 30;   // ~1 hr
  else if (durationHrs <= 2.0) base = 45;    // ~1.5–2 hr
  else if (durationHrs <= 2.5) base = 60;    // ~2–2.5 hr
  else if (durationHrs <= 3.5) base = 75;    // ~2.5–3.5 hr
  else base = 90;                             // 3.5+ hr endurance

  // Allometric scaling: adjust slightly for body weight vs 70kg reference
  const weightFactor = Math.pow(bodyWeightKg / 70, 0.75);
  return Math.round(base * weightFactor);
}

// ─── GENDER & AGE ADJUSTMENTS ─────────────────────────────────────────────────

/**
 * Returns multipliers based on gender and age for carbs, sweat rate, and sodium.
 * Sources: ACSM Position Stand; Tarnopolsky (2008); Toth & Mazzeo (2019).
 */
function getPhysiologyMultipliers(gender, age) {
  // Gender: females have lower sweat rate and slightly lower carb oxidation capacity
  const isFemale = gender === 'female';
  const genderCarbMult  = isFemale ? 0.88 : 1.0;   // ~12% lower carb needs
  const genderSweatMult = isFemale ? 0.83 : 1.0;   // ~17% lower sweat rate

  // Age groups
  let ageCarbMult  = 1.0;
  let ageSweatMult = 1.0;
  let ageSodiumMult = 1.0;
  let ageGroup = 'open';

  if (age < 20) {
    // Youth: higher relative carb needs during growth phase
    ageCarbMult  = 1.05;
    ageSweatMult = 0.95;
    ageGroup = 'youth';
  } else if (age < 35) {
    // Open: baseline — no adjustment
    ageGroup = 'open';
  } else if (age < 50) {
    // Masters: slightly reduced carb oxidation, more recovery focus
    ageCarbMult  = 0.93;
    ageGroup = 'masters';
  } else {
    // Senior 50+: reduced carb capacity, higher electrolyte & protein importance
    ageCarbMult   = 0.85;
    ageSweatMult  = 0.92;
    ageSodiumMult = 1.10; // electrolytes more critical
    ageGroup = 'senior';
  }

  return {
    carbMult:   genderCarbMult * ageCarbMult,
    sweatMult:  genderSweatMult * ageSweatMult,
    sodiumMult: ageSodiumMult,
    ageGroup,
  };
}

// ─── MAIN CALCULATION FUNCTION ────────────────────────────────────────────────

function calculatePlan(input) {
  const {
    sport = 'running',
    durationHrs,
    bodyWeightKg,
    gender = 'male',
    age = 30,
    sweatLevel = 'medium',
    saltiness = 'medium',
    temperature = 'warm',
    sweatRateMlHr = null,   // from sweat test — overrides estimate when provided
    sweatSodiumMgL = null,  // from sweat test — overrides saltiness estimate when provided
    experience = 'intermediate',
    splits = null,
    fuelPreference = 'mixed',
  } = input;

  const sportData = SPORTS[sport] || SPORTS.other;

  // ── Physiology adjustments for gender & age ──
  const physio = getPhysiologyMultipliers(gender, parseInt(age) || 30);

  // ── Sweat & Fluid ──
  // If user provided actual sweat rate from a test, use it directly (still apply temperature adjustment)
  let sweatRatePerHr;
  const tempAdj = TEMP_ADJUSTMENTS[temperature] || 0;
  const hasSweatTest = sweatRateMlHr && sweatRateMlHr > 0;
  if (hasSweatTest) {
    // Lab-measured rate: apply only temperature on top (gender/age already reflected in their physiology)
    sweatRatePerHr = Math.round(sweatRateMlHr * (1 + tempAdj));
  } else {
    const baseSweatRate = SWEAT_RATES[sweatLevel] * sportData.sweatMultiplier * physio.sweatMult;
    sweatRatePerHr = Math.round(baseSweatRate * (1 + tempAdj));
  }

  // Recommended fluid: replace 70–80% of sweat losses (max 1L/h usually)
  let fluidPerHr = Math.round(sweatRatePerHr * 0.75);
  // Cap global fluid intake (human gut limit is typically ~900-1200ml/hr)
  if (fluidPerHr > 1200) fluidPerHr = 1200;
  // Task 2.3: Hard fluid cap for running (sloshing prevention)
  if (sport === 'running' && fluidPerHr > 800) {
    fluidPerHr = 800;
  }

  // ── Sodium ──
  // Target sodium INTAKE should match the concentration of the fluid you *actually drink*, 
  // not the total fluid you lost (otherwise you get absurdly high 4000mg targets).
  const hasSodiumTest = sweatSodiumMgL && sweatSodiumMgL > 0;
  const sodiumConc = hasSodiumTest ? sweatSodiumMgL : (SODIUM_CONCENTRATION[saltiness] || 900);
  
  // Calculate target intake based on the fluid we prescribe (fluidPerHr/1000 -> Litres)
  const sodiumPerHr = Math.round((fluidPerHr / 1000) * sodiumConc * (hasSodiumTest ? 1 : physio.sodiumMult));

  // ── Carbohydrates ──
  const carbsPerHr = Math.round(
    getCarbTarget(durationHrs, bodyWeightKg) * sportData.carbMultiplier * physio.carbMult
  );

  // ── Total Race Needs ──
  const totalCarbs = Math.round(carbsPerHr * durationHrs);
  const totalFluids = Math.round(fluidPerHr * durationHrs);
  const totalSodium = Math.round(sodiumPerHr * durationHrs);

  // ── Segmented timeline ──
  const timeline = splits
    ? buildTriathlonTimeline(splits, carbsPerHr, fluidPerHr, sodiumPerHr)
    : buildSegmentedTimeline(sport, durationHrs, carbsPerHr, fluidPerHr, sodiumPerHr);

  // ── Product Recommendations ──
  const products = recommendProducts({
    carbsPerHr,
    sodiumPerHr,
    fluidPerHr,
    durationHrs,
    totalCarbs,
    fuelPreference,
  });

  // ── Per-segment breakdown for triathlon ──
  const segmentBreakdown = splits ? buildSegmentBreakdown(splits, carbsPerHr, fluidPerHr, sodiumPerHr) : null;

  // ── Physiology note for Results display ──
  const physiologyNote = buildPhysiologyNote(gender, parseInt(age) || 30, physio);

  return {
    meta: {
      sport: sportData.label,
      durationHrs,
      bodyWeightKg,
      gender,
      age: parseInt(age) || 30,
      ageGroup: physio.ageGroup,
      temperature,
      sweatLevel,
      sweatTestUsed: hasSweatTest || hasSodiumTest,
      sweatRateMlHr: hasSweatTest ? sweatRateMlHr : null,
      sweatSodiumMgL: hasSodiumTest ? sweatSodiumMgL : null,
      physiologyNote,
    },

    perHour: {
      carbsG: carbsPerHr,
      sodiumMg: sodiumPerHr,
      fluidMl: fluidPerHr,
    },
    totals: {
      carbsG: totalCarbs,
      sodiumMg: totalSodium,
      fluidMl: totalFluids,
    },
    sweatRatePerHr,
    timeline,
    segmentBreakdown,
    products,
    tips: generateTips({ carbsPerHr, sodiumPerHr, durationHrs, experience, temperature, gender, age: parseInt(age) || 30, ageGroup: physio.ageGroup }),
  };
}

// ─── SEGMENT BREAKDOWN (Triathlon) ────────────────────────────────────────────

const SEGMENT_CONFIG = {
  swim: { icon: '🏊', label: 'Swim',            carbMultiplier: 0.3, note: 'No carbs during swim. Hydrate pre-race only.' },
  t1:   { icon: '👟', label: 'T1 Transition',   carbMultiplier: 0,   note: 'Quick gels or chews. Grab bottle for bike.' },
  bike: { icon: '🚴', label: 'Bike',             carbMultiplier: 1.2, note: 'Prime fuelling window. Target 60–90g carbs/hr.' },
  t2:   { icon: '👟', label: 'T2 Transition',   carbMultiplier: 0,   note: 'Last gel before run. Top up electrolytes.' },
  run:  { icon: '🏃', label: 'Run',              carbMultiplier: 0.9, note: 'Stick to gels & cola in later miles.' },
};

function buildSegmentBreakdown(splits, carbsPerHr, fluidPerHr, sodiumPerHr) {
  return Object.entries(splits).map(([key, durationMins]) => {
    const cfg = SEGMENT_CONFIG[key] || { icon: '⚡', label: key, carbMultiplier: 1.0, note: '' };
    const hrs = durationMins / 60;
    const carbs  = key === 'swim' || key === 't1' || key === 't2' ? 0 : Math.round(carbsPerHr * cfg.carbMultiplier * hrs);
    
    // Apply 800ml cap for running phase within triathlon to prevent sloshing
    const localFluidHr = (key === 'run' && fluidPerHr > 800) ? 800 : fluidPerHr;
    const fluid  = Math.round(localFluidHr * hrs * (key === 'swim' ? 0 : 1));
    const sodium = Math.round(sodiumPerHr * hrs * (key === 'swim' ? 0 : 1));
    return {
      segment: key,
      icon: cfg.icon,
      label: cfg.label,
      durationMins,
      carbsG: carbs,
      fluidMl: fluid,
      sodiumMg: sodium,
      note: cfg.note,
    };
  });
}

// ─── SEGMENTED TIMELINE (non-triathlon) ──────────────────────────────────────

function buildSegmentedTimeline(sport, durationHrs, carbsPerHr, fluidPerHr, sodiumPerHr) {
  const totalMin = Math.round(durationHrs * 60);
  const intervalMin = durationHrs <= 1 ? 15 : durationHrs <= 2 ? 20 : 30;

  const sportSection = {
    running:  { icon: '🏃', label: 'Run' },
    cycling:  { icon: '🚴', label: 'Bike' },
    swimming: { icon: '🏊', label: 'Swim' },
    other:    { icon: '⚡', label: 'Race' },
  }[sport] || { icon: '⚡', label: 'Race' };

  // Pre-race section
  const preRace = {
    segment: 'pre-race', icon: '⏱', label: 'Pre-Race',
    items: [
      { timeMin: -30, label: 'T-30 min', carbsG: 0, fluidMl: 300, sodiumMg: 300,
        note: 'Top up hydration. Small carb snack if needed. No heavy food.' },
      { timeMin: -5, label: 'T-5 min', carbsG: 0, fluidMl: 150, sodiumMg: 0,
        note: 'Last sip of electrolyte drink. Set your watch.' },
    ],
  };

  // Race section
  const raceItems = [];
  for (let min = 0; min <= totalMin; min += intervalMin) {
    const fraction = intervalMin / 60;
    raceItems.push({
      timeMin: min,
      label: min === 0 ? 'Race Start' : min >= totalMin ? 'Finish 🏁' : `${min} min`,
      carbsG:    min === 0 ? 0 : Math.round(carbsPerHr * fraction),
      fluidMl:   Math.round(fluidPerHr * fraction),
      sodiumMg:  min === 0 ? 0 : Math.round(sodiumPerHr * fraction),
      note: getRaceNote(min, totalMin, carbsPerHr),
    });
  }

  return [
    preRace,
    { segment: sportSection.label.toLowerCase(), icon: sportSection.icon, label: sportSection.label, items: raceItems },
  ];
}

// ─── TRIATHLON SEGMENTED TIMELINE ────────────────────────────────────────────

function buildTriathlonTimeline(splits, carbsPerHr, fluidPerHr, sodiumPerHr) {
  const sections = [];
  let cursor = 0; // running offset in minutes from race start

  // Pre-race
  sections.push({
    segment: 'pre-race', icon: '⏱', label: 'Pre-Race',
    items: [
      { timeMin: -30, label: 'T-30 min', carbsG: 0, fluidMl: 300, sodiumMg: 300,
        note: 'Top up hydration. 60–80g carbs from breakfast 2–3h ago.' },
      { timeMin: -5, label: 'T-5 min', carbsG: 30, fluidMl: 150, sodiumMg: 0,
        note: 'Quick gel or chew just before the start. Sip electrolyte drink.' },
    ],
  });

  // Process each segment in order
  const order = ['swim', 't1', 'bike', 't2', 'run'];
  const cfg = {
    swim: { icon: '🏊', label: 'Swim',         interval: null,  carbMult: 0   },
    t1:   { icon: '🔄', label: 'T1 Transition', interval: null, carbMult: 0   },
    bike: { icon: '🚴', label: 'Bike',          interval: 30,   carbMult: 1.2 },
    t2:   { icon: '🔄', label: 'T2 Transition', interval: null, carbMult: 0   },
    run:  { icon: '🏃', label: 'Run',           interval: 30,   carbMult: 0.9 },
  };

  for (const key of order) {
    const durationMins = splits[key];
    if (!durationMins) continue;
    const c = cfg[key];
    const segStart = cursor;
    const segEnd   = cursor + durationMins;
    const items    = [];

    if (c.interval === null) {
      // Transition / swim — single checkpoint at end
      if (key === 'swim') {
        items.push({
          timeMin: segStart,
          label: 'Swim Start',
          carbsG: 0, fluidMl: 0, sodiumMg: 0,
          note: 'No nutrition during swim. Focus on pace and breathing.',
        });
        items.push({
          timeMin: segEnd,
          label: `Swim End (+${durationMins}min)`,
          carbsG: 0, fluidMl: 0, sodiumMg: 0,
          note: 'Heading into T1. Grab gel for early bike.',
        });
      } else {
        // t1 or t2
        const isT1 = key === 't1';
        items.push({
          timeMin: segStart,
          label: isT1 ? 'T1 Start' : 'T2 Start',
          carbsG: 25, fluidMl: 150, sodiumMg: 200,
          note: isT1
            ? 'Take a gel. Mount your bike with a bottle ready.'
            : 'Last gel before run. Grab a cup of water to start.',
        });
      }
    } else {
      // Bike or Run — interval checkpoints
      const interval = c.interval;
      const fraction = interval / 60;
      let localMin = 0;
      while (localMin <= durationMins) {
        const absMin = segStart + localMin;
        const isFirst = localMin === 0;
        const isLast  = localMin >= durationMins;
        
        // Fluid cap for running phase
        const localFluidHr = (key === 'run' && fluidPerHr > 800) ? 800 : fluidPerHr;

        items.push({
          timeMin: absMin,
          label: isFirst ? `${c.label} Start`
               : isLast  ? `${c.label} End 🏁`
               : `+${localMin} min`,
          carbsG:   isFirst ? 0 : Math.round(carbsPerHr * c.carbMult * fraction),
          fluidMl:  Math.round(localFluidHr * fraction),
          sodiumMg: isFirst ? 0 : Math.round(sodiumPerHr * fraction),
          note: getSegmentNote(key, localMin, durationMins),
        });
        if (isLast) break;
        localMin = Math.min(localMin + interval, durationMins);
      }
    }

    sections.push({ segment: key, icon: c.icon, label: c.label, items });
    cursor = segEnd;
  }

  return sections;
}

function getSegmentNote(segment, localMin, totalMin) {
  if (segment === 'bike') {
    if (localMin === 0) return 'Start eating within 15 min. Aim for 60–90g carbs/hr.';
    if (localMin >= totalMin) return 'Ease up pace slightly. Prep for run.';
    if (localMin % 60 === 0) return 'Hourly check — are you hitting your carb target?';
    return '';
  }
  if (segment === 'run') {
    if (localMin === 0) return 'Start conservatively. Gels every 20–25 min.';
    if (localMin >= totalMin) return 'Finish strong! Electrolytes in final km.';
    return '';
  }
  return '';
}

function getRaceNote(min, totalMin, carbsPerHr) {
  if (min === 0) return 'Start well-fueled. Take first carb at 20–30 min.';
  if (min <= 20) return carbsPerHr > 0 ? 'Time for first gel/chew.' : 'Short effort — water only.';
  if (min >= totalMin) return 'Cross the finish line strong!';
  if (min % 60 === 0) return 'Hourly check: stick to your plan.';
  return '';
}

// ─── PRODUCT CATALOG ─────────────────────────────────────────────────────────
// Primary: Precision Hydration. Secondary: Maurten. No combo bundles.
// Each product includes per-serving nutrition facts for the tooltip.

/*
 * ─── VERIFIED NUTRITION FACTS ────────────────────────────────────────────────
 * Sources:
 *   Precision Hydration: precisionhydration.com, runningwarehouse.com, thefeed.com
 *   Maurten: maurten.com, amazon.com product listings, runivore.com reviews
 *
 * IMPORTANT NOTES on Precision Hydration naming:
 *   PH 500/1000/1500 = sodium concentration per LITRE of prepared drink.
 *   A single sachet dissolved in 500ml gives:
 *     PH 500  → 250mg Na per 500ml serving
 *     PH 1000 → 500mg Na per 500ml serving  (= 1000mg/L)
 *     PH 1500 → 750mg Na per 500ml serving  (= 1500mg/L)
 *   The PF (Precision Fuel) gels contain ZERO sodium by design — athletes use
 *   them alongside PH drink mixes for separate carb + electrolyte delivery.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const HIBOOST_PRODUCTS = [
  // ── Precision Hydration — Electrolyte Drinks ──
  {
    id: 'ph-sweat-500',
    name: 'PH 500 Electrolyte Drink Mix',
    brand: 'Precision Fuel & Hydration',
    type: 'electrolyte+fluid',
    servingSize: '1 sachet in 500ml water',
    // 500mg Na per litre → 250mg per 500ml. Source: precisionhydration.com
    nutrition: { carbsG: 3, sodiumMg: 250, potassiumMg: 65, proteinG: 0, calories: 12 },
    fluidMl: 500,
    priceVND: 50000,
    priceUSD: 2.0,
    url: 'https://www.hiboostnutrition.com/products/precision-hydration-500',
    reason: 'Light electrolyte drink for shorter efforts or light sweaters. 250mg Na per 500ml, near-zero carb.',
  },
  {
    id: 'ph-sweat-1000',
    name: 'PH 1000 Electrolyte Drink Mix',
    brand: 'Precision Fuel & Hydration',
    type: 'electrolyte+fluid',
    servingSize: '1 sachet in 500ml water',
    // 1000mg Na per litre → 500mg per 500ml. Source: precisionhydration.com, thefeed.com
    nutrition: { carbsG: 4, sodiumMg: 500, potassiumMg: 130, proteinG: 0, calories: 16 },
    fluidMl: 500,
    priceVND: 50000,
    priceUSD: 2.0,
    url: 'https://www.hiboostnutrition.com/products/precision-hydration-1000',
    reason: 'Moderate-strength electrolyte drink — 500mg Na per 500ml. Suits most athletes in warm conditions.',
  },
  {
    id: 'ph-sweat-1500',
    name: 'PH 1500 Electrolyte Drink Mix',
    brand: 'Precision Fuel & Hydration',
    type: 'electrolyte+fluid',
    servingSize: '1 sachet in 500ml water',
    // 1500mg Na per litre → 750mg per 500ml. Source: precisionhydration.com, carbonendurance.co
    nutrition: { carbsG: 2, sodiumMg: 750, potassiumMg: 125, proteinG: 0, calories: 16 },
    fluidMl: 500,
    priceVND: 50000,
    priceUSD: 2.0,
    url: 'https://www.hiboostnutrition.com/products/precision-hydration-1500',
    reason: 'Strongest electrolyte mix — 750mg Na per 500ml. For heavy/salty sweaters and hot-race conditions.',
  },

  // ── Precision Fuel — Energy Gels ──
  {
    id: 'ph-gel',
    name: 'PF 30 Energy Gel',
    brand: 'Precision Fuel & Hydration',
    type: 'carb',
    servingSize: '1 gel (51g)',
    // 30g carbs, 120 kcal, NO sodium (0mg) by design. Source: precisionhydration.com, fatsecret.com
    nutrition: { carbsG: 30, sodiumMg: 0, potassiumMg: 0, proteinG: 0, calories: 120 },
    fluidMl: 0,
    priceVND: 109000,
    priceUSD: 4.4,
    url: 'https://www.hiboostnutrition.com/products/precision-fuel-gel',
    reason: '30g fast-acting carbs, no electrolytes by design. Use alongside PH drink mix for complete fuelling.',
  },
  {
    id: 'ph-gel-caffeine',
    name: 'PF 30 Caffeine Gel',
    brand: 'Precision Fuel & Hydration',
    type: 'carb',
    servingSize: '1 gel (51g)',
    // Same as PF 30 Gel + 100mg caffeine. Source: precisionhydration.com
    nutrition: { carbsG: 30, sodiumMg: 0, potassiumMg: 0, proteinG: 0, calories: 120, caffeineMg: 100 },
    fluidMl: 0,
    priceVND: 129000,
    priceUSD: 5.2,
    url: 'https://www.hiboostnutrition.com/products/precision-fuel-gel-caffeine',
    reason: '30g carbs + 100mg caffeine, 0mg sodium. Save for the final third of your race for a late-race lift.',
  },
  {
    id: 'ph-chew',
    name: 'PF 30 Energy Chew',
    brand: 'Precision Fuel & Hydration',
    type: 'carb',
    servingSize: '1 packet (4 chews, 40g)',
    // Same macros as PF 30 Gel in chew form. Source: precisionhydration.com
    nutrition: { carbsG: 30, sodiumMg: 0, potassiumMg: 0, proteinG: 0, calories: 120 },
    fluidMl: 0,
    priceVND: 80000,
    priceUSD: 3.2,
    url: 'https://www.hiboostnutrition.com/products/precision-fuel-chew',
    reason: '30g carbs in chew format, 0mg sodium. Easier to eat on the bike; pair with PH drink for electrolytes.',
  },
  {
    id: 'ph-90-gel',
    name: 'PF 90 Energy Gel',
    brand: 'Precision Fuel & Hydration',
    type: 'carb',
    servingSize: '1 pouch (153g) — resealable',
    // 90g carbs, 360 kcal, 0 sodium. Source: runningwarehouse.com, amazon.com
    nutrition: { carbsG: 90, sodiumMg: 0, potassiumMg: 0, proteinG: 0, calories: 360 },
    fluidMl: 0,
    priceVND: 243000,
    priceUSD: 9.7,
    url: 'https://www.hiboostnutrition.com/products/precision-fuel-90-gel',
    reason: '90g carbs in one large resealable pouch — 3× PF 30 in one. Ideal for 3h+ efforts on the bike.',
  },
  {
    id: 'ph-salt-caps',
    name: 'PH Electrolyte Capsules',
    brand: 'Precision Fuel & Hydration',
    type: 'electrolyte',
    servingSize: '1–2 capsules with 250ml water',
    // PH capsule = ~500mg Na per tablet (same dose as 1 PH 1000 tablet). Source: precisionhydration.com, endurancekollective.co
    nutrition: { carbsG: 0, sodiumMg: 500, potassiumMg: 130, proteinG: 0, calories: 10 },
    fluidMl: 0,
    priceVND: 17000,
    priceUSD: 0.7,
    url: 'https://www.hiboostnutrition.com/products/precision-hydration-caps',
    reason: '500mg sodium per capsule. Pocket-friendly electrolyte top-up; take with water during transitions.',
  },

  // ── Maurten — Hydrogel Technology ──
  {
    id: 'maurten-320',
    name: 'Maurten Drink Mix 320',
    brand: 'Maurten',
    type: 'carb+fluid',
    servingSize: '1 sachet (83g) in 500ml water',
    // 80g carbs, 320 kcal, 245mg sodium per sachet (83g). Source: official Maurten nutrition label
    nutrition: { carbsG: 80, sodiumMg: 245, potassiumMg: 0, proteinG: 0, calories: 320 },
    fluidMl: 500,
    priceVND: 140000,
    priceUSD: 5.6,
    url: 'https://www.hiboostnutrition.com/products/maurten-drink-mix-320',
    reason: 'Hydrogel formula — 80g carbs + mild electrolytes in 500ml. Gentler on GI at high carb rates.',
  },
  {
    id: 'maurten-gel-100',
    name: 'Maurten Gel 100',
    brand: 'Maurten',
    type: 'carb',
    servingSize: '1 gel (40g)',
    // 25g carbs, 100 kcal, 20mg sodium. Source: amazon.com, maurten.com.au, runningwarehouse.com
    nutrition: { carbsG: 25, sodiumMg: 20, potassiumMg: 0, proteinG: 0, calories: 100 },
    fluidMl: 0,
    priceVND: 119000,
    priceUSD: 4.8,
    url: 'https://www.hiboostnutrition.com/products/maurten-gel-100',
    reason: 'Hydrogel gel — 25g carbs, ultra-smooth texture and easy to swallow at race pace.',
  },
  {
    id: 'maurten-gel-100-caf',
    name: 'Maurten Gel 100 CAF 100',
    brand: 'Maurten',
    type: 'carb',
    servingSize: '1 gel (40g)',
    // 25g carbs, 100 kcal, 22mg sodium, 100mg caffeine. Source: amazon.com, recoveryforathletes.com, nutri-bay.com
    nutrition: { carbsG: 25, sodiumMg: 22, potassiumMg: 0, proteinG: 0, calories: 100, caffeineMg: 100 },
    fluidMl: 0,
    priceVND: 139000,
    priceUSD: 5.6,
    url: 'https://www.hiboostnutrition.com/products/maurten-gel-100-caf',
    reason: '25g carbs + 100mg caffeine. Use in the second half of your race for a late-race kick.',
  },
];

function recommendProducts({ carbsPerHr, sodiumPerHr, fluidPerHr, durationHrs, totalCarbs, fuelPreference = 'mixed' }) {
  const recs = [];
  const isLong = durationHrs >= 3;
  const isHighSodium = sodiumPerHr >= 700;
  const isHighCarb = carbsPerHr >= 60;

  // 1. Primary Electrolyte Drink OR Maurten 320 for Mix/Liquid preference
  let carbsFromLiquidPerHr = 0;
  if ((fuelPreference === 'liquid' || fuelPreference === 'mixed') && carbsPerHr >= 50 && durationHrs >= 1.5) {
    const sachetPerHr = fuelPreference === 'liquid' ? (carbsPerHr / 80) : (carbsPerHr / 2 / 80);
    const totalSachets = Math.ceil(sachetPerHr * durationHrs);
    if (totalSachets > 0) {
       recs.push({
         ...HIBOOST_PRODUCTS.find(p => p.id === 'maurten-320'),
         quantity: totalSachets,
         usage: `Pha 1 gói (80g carbs) vào 500ml. Uống từ từ mỗi 15 phút. Nguồn hydrogel hạn chế tức bụng.`,
       });
       carbsFromLiquidPerHr = sachetPerHr * 80;
    }
  }

  // 1b. If Maurten doesn't provide enough sodium or they prefer gels, use PH Hydration Mix
  if (durationHrs >= 0.75 && (carbsFromLiquidPerHr === 0 || sodiumPerHr > 500)) {
    // Pick PH strength by sodium need
    let electrolyteDrink;
    if (isHighSodium) {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-1500');
    } else if (sodiumPerHr >= 400) {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-1000');
    } else {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-500');
    }
    const bottlesNeeded = Math.max(1, Math.ceil(durationHrs / 1.5));
    recs.push({
      ...electrolyteDrink,
      quantity: bottlesNeeded,
      usage: `Pha 1 gói cho 500ml nước. Cấp nước và điện giải liên tục.`,
    });
  }

  // ── 2. Carb Gels (Cover the missing carbs after liquid) ──
  const missingCarbsPerHr = carbsPerHr - carbsFromLiquidPerHr;
  if (missingCarbsPerHr >= 15 && durationHrs >= 0.75) {
    const gel = HIBOOST_PRODUCTS.find(p => p.id === 'ph-gel');
    const gelsPerHr = missingCarbsPerHr / 30;
    const totalGels = Math.ceil(gelsPerHr * durationHrs);
    const interval = Math.round(60 / gelsPerHr);
    recs.push({
      ...gel,
      quantity: totalGels,
      usage: `Ăn 1 gel mỗi ${interval} phút. Không nạp cùng lúc với lúc uống Maurten 320.`,
    });
  }

  // ── 3. Caffeine Gel for the second half (long events) ──
  if (isLong && carbsPerHr >= 30) {
    const cafGel = HIBOOST_PRODUCTS.find(p => p.id === 'ph-gel-caffeine');
    recs.push({
      ...cafGel,
      quantity: Math.ceil(durationHrs / 3),
      usage: `Save for the final third of your race. Max 2–3 per event.`,
    });
  }

  // ── 4. PF 90 Gel (high-carb athletes targeting 80+ g/hr, long events on bike) ──
  if (isHighCarb && isLong) {
    const pf90 = HIBOOST_PRODUCTS.find(p => p.id === 'ph-90-gel');
    recs.push({
      ...pf90,
      quantity: Math.ceil(durationHrs / 1.5),
      usage: `Resealable 90g carb pouch for bike leg. Sip gradually — 1 pouch lasts ~1.5h at 60g/hr.`,
    });
  }

  // ── 5. Salt Capsules (heavy sweaters or events ≥ 2h) ──
  if (sodiumPerHr >= 400 || durationHrs >= 2) {
    const caps = HIBOOST_PRODUCTS.find(p => p.id === 'ph-salt-caps');
    const capsNeeded = Math.ceil((sodiumPerHr * durationHrs) / 250);
    recs.push({
      ...caps,
      quantity: capsNeeded,
      usage: `Take 1–2 caps with water every 30–45 min.`,
    });
  }

  // ── 7. Maurten Gel (premium alternative) ──
  if (durationHrs >= 1.5 && carbsPerHr >= 40) {
    recs.push({
      ...HIBOOST_PRODUCTS.find(p => p.id === 'maurten-gel-100'),
      quantity: Math.ceil((carbsPerHr * durationHrs) / 25),
      usage: `Premium gel option. Take 1 every ${Math.round(60 / (carbsPerHr / 25))} min as an alternative to PF 30.`,
    });
  }

  return recs;
}

// ─── PHYSIOLOGY NOTE ─────────────────────────────────────────────────────────

function buildPhysiologyNote(gender, age, physio) {
  const genderLabel = gender === 'female' ? 'Female' : 'Male';
  const ageGroupNotes = {
    youth:   'Growth phase — carb needs scaled up slightly.',
    open:    'Peak performance range — baseline targets applied.',
    masters: 'Masters athlete — carb capacity modestly reduced; recovery nutrition matters more.',
    senior:  '50+ — reduced carb oxidation; sodium & electrolytes prioritised.',
  };

  const carbPct = Math.round((physio.carbMult - 1) * 100);
  const sweatPct = Math.round((physio.sweatMult - 1) * 100);
  const carbAdj  = carbPct === 0 ? 'no carb adjustment' : `carbs ${carbPct > 0 ? '+' : ''}${carbPct}%`;
  const sweatAdj = sweatPct === 0 ? 'no sweat adjustment' : `sweat rate ${sweatPct > 0 ? '+' : ''}${sweatPct}%`;

  return `${genderLabel}, age ${age} (${physio.ageGroup}): ${ageGroupNotes[physio.ageGroup]} Applied: ${carbAdj}, ${sweatAdj}.`;
}

// ─── TIPS GENERATOR ───────────────────────────────────────────────────────────

function generateTips({ carbsPerHr, sodiumPerHr, durationHrs, experience, temperature, gender, age, ageGroup }) {
  const tips = [];

  // Gender-specific tips
  if (gender === 'female') {
    tips.push('tip_female_fat_ox');
    if (durationHrs >= 2) tips.push('tip_female_cycle');
  }

  // Age-specific tips
  if (ageGroup === 'youth') {
    tips.push('tip_youth_growth');
  } else if (ageGroup === 'masters') {
    tips.push('tip_masters_recovery');
  } else if (ageGroup === 'senior') {
    tips.push('tip_senior_electrolytes');
    tips.push('tip_senior_protein');
  }

  if (carbsPerHr === 0) {
    tips.push('tip_short_effort');
  } else if (carbsPerHr >= 75) {
    tips.push('tip_high_carb_gut');
    tips.push('tip_high_carb_mix');
  }

  if (sodiumPerHr >= 700) {
    tips.push('tip_salty_sweater');
  }

  if (['hot', 'very_hot'].includes(temperature)) {
    tips.push('tip_hot_conditions');
    tips.push('tip_pre_cooling');
  }

  if (durationHrs >= 3) {
    tips.push('tip_carb_load');
    tips.push('tip_practice_full');
  }

  if (experience === 'beginner') {
    tips.push('tip_beginner_conservative');
  }

  return tips;
}

module.exports = { calculatePlan, SPORTS, HIBOOST_PRODUCTS };