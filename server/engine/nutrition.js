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

  // Recommended fluid: replace 70–80% of sweat losses (avoid over-drinking)
  const fluidPerHr = Math.round(sweatRatePerHr * 0.75);

  // ── Sodium ──
  // If user has measured sodium concentration from sweat test, use it; otherwise estimate from saltiness
  const hasSodiumTest = sweatSodiumMgL && sweatSodiumMgL > 0;
  const sodiumConc = hasSodiumTest ? sweatSodiumMgL : (SODIUM_CONCENTRATION[saltiness] || 900);
  const sodiumPerHr = Math.round((sweatRatePerHr / 1000) * sodiumConc * (hasSodiumTest ? 1 : physio.sodiumMult));

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
    const fluid  = Math.round(fluidPerHr * hrs * (key === 'swim' ? 0 : 1));
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
        items.push({
          timeMin: absMin,
          label: isFirst ? `${c.label} Start`
               : isLast  ? `${c.label} End 🏁`
               : `+${localMin} min`,
          carbsG:   isFirst ? 0 : Math.round(carbsPerHr * c.carbMult * fraction),
          fluidMl:  Math.round(fluidPerHr * fraction),
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
    priceVND: 40000,
    priceUSD: 1.6,
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
    priceVND: 45000,
    priceUSD: 1.8,
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
    priceVND: 60000,
    priceUSD: 2.4,
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
    priceVND: 65000,
    priceUSD: 2.6,
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
    priceVND: 55000,
    priceUSD: 2.2,
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
    priceVND: 120000,
    priceUSD: 4.8,
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
    priceVND: 20000,
    priceUSD: 0.8,
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
    // 80g carbs, 320 kcal, 110mg sodium (salt 0.28g/serving). Source: maurten.com official nutrition label
    nutrition: { carbsG: 80, sodiumMg: 110, potassiumMg: 0, proteinG: 0, calories: 320 },
    fluidMl: 500,
    priceVND: 120000,
    priceUSD: 4.8,
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
    priceVND: 95000,
    priceUSD: 3.8,
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
    priceVND: 105000,
    priceUSD: 4.2,
    url: 'https://www.hiboostnutrition.com/products/maurten-gel-100-caf',
    reason: '25g carbs + 100mg caffeine. Use in the second half of your race for a late-race kick.',
  },
];

function recommendProducts({ carbsPerHr, sodiumPerHr, fluidPerHr, durationHrs, totalCarbs }) {
  const recs = [];
  const isLong = durationHrs >= 3;
  const isHighSodium = sodiumPerHr >= 700;
  const isHighCarb = carbsPerHr >= 60;

  // ── 1. Primary Electrolyte Drink (always recommend for events ≥ 45min) ──
  if (durationHrs >= 0.75) {
    // Pick PH strength by sodium need
    let electrolyteDrink;
    if (isHighSodium) {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-1500');
    } else if (sodiumPerHr >= 400) {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-1000');
    } else {
      electrolyteDrink = HIBOOST_PRODUCTS.find(p => p.id === 'ph-sweat-500');
    }
    const bottlesNeeded = Math.max(1, Math.ceil(durationHrs / 1.25));
    recs.push({
      ...electrolyteDrink,
      quantity: bottlesNeeded,
      usage: `Mix 1 sachet per 500ml bottle. Sip every 15–20 min throughout.`,
    });
  }

  // ── 2. Carb Gels (for events ≥ 1h with carb targets) ──
  if (carbsPerHr >= 20 && durationHrs >= 0.75) {
    const gel = HIBOOST_PRODUCTS.find(p => p.id === 'ph-gel');
    const gelsPerHr = carbsPerHr / 30;
    const totalGels = Math.ceil(gelsPerHr * durationHrs);
    const interval = Math.round(60 / gelsPerHr);
    recs.push({
      ...gel,
      quantity: totalGels,
      usage: `Take 1 gel every ${interval} min. Start at 20–30 min into the race.`,
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

  // ── 6. Maurten Drink Mix 320 (premium option for 3h+ high-carb athletes) ──
  if (durationHrs >= 3 && carbsPerHr >= 50) {
    recs.push({
      ...HIBOOST_PRODUCTS.find(p => p.id === 'maurten-320'),
      quantity: Math.ceil(durationHrs / 1.5),
      usage: `Alternative to PF 90. Hydrogel formula — gentler on the gut at high carb rates.`,
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
    tips.push('Female athletes: oestrogen promotes fat oxidation — you may tolerate slightly lower carb intake than male athletes at same intensity.');
    if (durationHrs >= 2) tips.push('Hormonal cycle can affect heat tolerance and fluid retention. Track your training nutrition across your cycle.');
  }

  // Age-specific tips
  if (ageGroup === 'youth') {
    tips.push('Youth athlete: your body needs more carbs relative to weight. Do not under-fuel — growth and recovery depend on adequate energy.');
  } else if (ageGroup === 'masters') {
    tips.push('Masters athlete (35–49): prioritise recovery nutrition with protein within 30 min of finishing. Carb absorption is similar but recovery is slower.');
  } else if (ageGroup === 'senior') {
    tips.push('50+ athlete: electrolytes become more critical — kidneys are less efficient at retaining sodium. Do not skip salt capsules.');
    tips.push('Protein intake post-race is more important than for younger athletes. Aim for 30–40g protein within 1 hour of finishing.');
  }

  if (carbsPerHr === 0) {
    tips.push('Short effort under 45 min — water is sufficient. No carbs needed.');
  } else if (carbsPerHr >= 75) {
    tips.push('High carb target: train your gut in long training sessions before race day to avoid GI issues.');
    tips.push('Use multiple carb sources (glucose + fructose) for better absorption above 60g/hr.');
  }

  if (sodiumPerHr >= 700) {
    tips.push('High sodium target: you\'re a salty sweater. Do not skip electrolytes even in shorter efforts.');
  }

  if (['hot', 'very_hot'].includes(temperature)) {
    tips.push('Hot conditions: start hydrating 2hrs before the race with 500ml water + electrolytes.');
    tips.push('Pre-cooling strategies (ice vest, cold drink) can improve performance in heat.');
  }

  if (durationHrs >= 3) {
    tips.push('For events 3+ hours: carb-load the 2 days before to maximize glycogen stores.');
    tips.push('Practice your full race nutrition plan in at least 2 long training sessions.');
  }

  if (experience === 'beginner') {
    tips.push('New to race nutrition? Start conservative — try half the carb target first, then increase.');
  }

  return tips;
}

module.exports = { calculatePlan, SPORTS, HIBOOST_PRODUCTS };