import { useState } from 'react';

export default function Results({ plan, form, restart }) {
  const { perHour, totals, timeline, products, tips, sweatRatePerHr, meta, segmentBreakdown } = plan;

  return (
    <div style={styles.container}>
      {/* Hero Banner */}
      <div style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <p style={styles.heroSubtitle}>Your personalized race plan</p>
          <h1 style={styles.heroTitle}>{meta.sport} · {meta.durationHrs}h</h1>
          <p style={styles.heroDetail}>
            {meta.bodyWeightKg}kg · {meta.gender === 'female' ? '♀ Female' : '♂ Male'} · Age {meta.age} · {capitalise(meta.sweatLevel)} sweater · {capitalise(meta.temperature)} conditions
          </p>
        </div>
        <button style={styles.restartBtn} onClick={restart}>↩ New Plan</button>
      </div>

      {/* Physiology note */}
      {meta.physiologyNote && (
        <div style={styles.physioNote}>
          <span style={styles.physioIcon}>🧬</span>
          <span>{meta.physiologyNote}</span>
          {meta.sweatTestUsed && (
            <span style={styles.sweatTestBadge}>
              🧪 Sweat test data used · {meta.sweatRateMlHr && `${meta.sweatRateMlHr} ml/hr`}{meta.sweatSodiumMgL && ` · ${meta.sweatSodiumMgL} mg/L sodium`}
            </span>
          )}
        </div>
      )}

      {/* Key Numbers */}
      <div style={styles.metricsRow}>
        <MetricCard
          icon="🍬"
          value={`${perHour.carbsG}g`}
          label="Carbs / hour"
          sub={`${totals.carbsG}g total`}
          color="#f97316"
        />
        <MetricCard
          icon="🧂"
          value={`${perHour.sodiumMg}mg`}
          label="Sodium / hour"
          sub={`${totals.sodiumMg}mg total`}
          color="#3b82f6"
        />
        <MetricCard
          icon="💧"
          value={`${perHour.fluidMl}ml`}
          label="Fluid / hour"
          sub={`${totals.fluidMl}ml total`}
          color="#22c55e"
        />
        <MetricCard
          icon="🌊"
          value={`${sweatRatePerHr}ml`}
          label="Sweat rate / hour"
          sub={meta.sweatTestUsed && meta.sweatRateMlHr ? '🧪 from your test' : 'estimated'}
          color="#a855f7"
        />
      </div>

      {/* Triathlon Segment Breakdown */}
      {segmentBreakdown && segmentBreakdown.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏁 Segment Fuel Breakdown</h2>
          <p style={styles.sectionDesc}>Nutrition targets for each part of your race.</p>
          <div style={styles.segGrid}>
            {segmentBreakdown.map((seg, i) => (
              <div key={i} style={styles.segCard}>
                <div style={styles.segTop}>
                  <span style={styles.segIcon}>{seg.icon}</span>
                  <div>
                    <div style={styles.segName}>{seg.label}</div>
                    <div style={styles.segDur}>
                      {seg.durationMins >= 60
                        ? `${Math.floor(seg.durationMins / 60)}h ${seg.durationMins % 60 > 0 ? (seg.durationMins % 60) + 'min' : ''}`
                        : `${seg.durationMins} min`}
                    </div>
                  </div>
                </div>
                <div style={styles.segNums}>
                  {seg.carbsG > 0   && <Pill color="#f97316">{seg.carbsG}g carbs</Pill>}
                  {seg.fluidMl > 0  && <Pill color="#22c55e">{seg.fluidMl}ml fluid</Pill>}
                  {seg.sodiumMg > 0 && <Pill color="#3b82f6">{seg.sodiumMg}mg sodium</Pill>}
                  {seg.carbsG === 0 && seg.fluidMl === 0 && <Pill color="#6b7280">No fuelling</Pill>}
                </div>
                {seg.note && <p style={styles.segNote}>{seg.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.twoCol}>
        {/* Segmented Timeline */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⏱ Race Timeline</h2>
          <p style={styles.sectionDesc}>Checkpoints by segment — when and what to take.</p>
          <div style={styles.timeline}>
            {timeline.map((section, si) => (
              <div key={si} style={styles.timelineSection}>
                {/* Section header */}
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionHeaderIcon}>{section.icon}</span>
                  <span style={styles.sectionHeaderLabel}>{section.label}</span>
                </div>
                {/* Items */}
                {section.items.map((point, i) => (
                  <div key={i} style={{
                    ...styles.timelineRow,
                    ...(i === section.items.length - 1 ? { borderLeftColor: 'transparent' } : {}),
                  }}>
                    <div style={{
                      ...styles.timelineDot,
                      background: section.segment === 'pre-race' ? '#94a3b8'
                        : section.segment === 'swim' ? '#3b82f6'
                        : section.segment === 'bike' ? '#f97316'
                        : section.segment === 'run'  ? '#16a34a'
                        : section.segment === 't1' || section.segment === 't2' ? '#8b5cf6'
                        : '#f97316',
                    }} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineTime}>{point.label}</span>
                        {point.note && <span style={styles.timelineNote}>{point.note}</span>}
                      </div>
                      <div style={styles.timelineNums}>
                        {point.carbsG > 0   && <Pill color="#f97316">{point.carbsG}g carbs</Pill>}
                        {point.fluidMl > 0  && <Pill color="#22c55e">{point.fluidMl}ml fluid</Pill>}
                        {point.sodiumMg > 0 && <Pill color="#3b82f6">{point.sodiumMg}mg sodium</Pill>}
                        {point.carbsG === 0 && point.fluidMl === 0 && point.sodiumMg === 0 &&
                          <Pill color="#94a3b8">No fuelling</Pill>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Product Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🛒 Recommended Products</h2>
            <p style={styles.sectionDesc}>From the HiBoost catalog, matched to your plan.</p>
            {products.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 14 }}>Short effort — water only, no products needed.</p>
            ) : (
              <div style={styles.productList}>
                {products.map((p, i) => (
                  <ProductCard key={i} product={p} />
                ))}
              </div>
            )}
          </div>

          {/* Science Tips */}
          {tips.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>💡 Key Tips for Your Plan</h2>
              <ul style={styles.tipList}>
                {tips.map((tip, i) => (
                  <li key={i} style={styles.tipItem}>
                    <span style={styles.tipBullet}>→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={styles.ctaBanner}>
        <div>
          <h3 style={styles.ctaTitle}>Ready to race?</h3>
          <p style={styles.ctaDesc}>Shop all recommended products on HiBoost Nutrition.</p>
        </div>
        <a href="https://www.hiboostnutrition.com/shop" target="_blank" rel="noreferrer" style={styles.ctaBtn}>
          Shop Now →
        </a>
      </div>

      <div style={styles.disclaimer}>
        ⚠️ This plan is generated based on population-average sports science formulas. Individual needs vary. Always test your nutrition strategy in training before race day. Consult a sports dietitian for medical or high-performance guidance.
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label, sub, color }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricIcon}>{icon}</span>
      <span style={{ ...styles.metricValue, color }}>{value}</span>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricSub}>{sub}</span>
    </div>
  );
}

function Pill({ color, children }) {
  return (
    <span style={{ ...styles.pill, background: color + '22', color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function ProductCard({ product }) {
  const [showNutrition, setShowNutrition] = useState(false);
  const nf = product.nutrition || {};

  return (
    <div
      style={styles.productCard}
      onMouseEnter={() => setShowNutrition(true)}
      onMouseLeave={() => setShowNutrition(false)}
    >
      <div style={styles.productTop}>
        <div>
          <p style={styles.productName}>{product.name}</p>
          <p style={styles.productType}>
            {typeLabel(product.type)}
            {product.brand && <span style={styles.productBrand}> · {product.brand}</span>}
          </p>
        </div>
        <div style={styles.productQty}>×{product.quantity}</div>
      </div>

      {/* Nutrition Facts tooltip — shown on hover */}
      {showNutrition && Object.keys(nf).length > 0 && (
        <div style={styles.nutritionTooltip}>
          <div style={styles.nfTitle}>Nutrition Facts <span style={styles.nfServing}>per serving ({product.servingSize || '1 unit'})</span></div>
          <div style={styles.nfGrid}>
            {nf.calories != null && <NfRow label="Calories" value={`${nf.calories} kcal`} />}
            {nf.carbsG != null    && <NfRow label="Carbs" value={`${nf.carbsG}g`} color="#f97316" />}
            {nf.sodiumMg != null  && <NfRow label="Sodium" value={`${nf.sodiumMg}mg`} color="#3b82f6" />}
            {nf.potassiumMg != null && nf.potassiumMg > 0 && <NfRow label="Potassium" value={`${nf.potassiumMg}mg`} color="#8b5cf6" />}
            {nf.proteinG != null && nf.proteinG > 0  && <NfRow label="Protein" value={`${nf.proteinG}g`} color="#16a34a" />}
            {nf.caffeineMg != null && <NfRow label="Caffeine" value={`${nf.caffeineMg}mg`} color="#dc2626" />}
          </div>
        </div>
      )}

      <p style={styles.productReason}>{product.reason}</p>
      <p style={styles.productUsage}>📋 {product.usage}</p>
      <div style={styles.productFooter}>
        <span style={styles.productPrice}>
          {product.priceVND ? `${(product.priceVND * product.quantity).toLocaleString()} VND` : ''}
        </span>
        {product.url && (
          <a href={product.url} target="_blank" rel="noreferrer" style={styles.productLink}>
            View product →
          </a>
        )}
      </div>
    </div>
  );
}

function NfRow({ label, value, color }) {
  return (
    <div style={styles.nfRow}>
      <span style={styles.nfLabel}>{label}</span>
      <span style={{ ...styles.nfValue, color: color || '#1e293b' }}>{value}</span>
    </div>
  );
}

function typeLabel(type) {
  const map = { carb: '🍬 Carbohydrate', electrolyte: '🧂 Electrolyte', 'carb+fluid': '🍬💧 Carbs + Fluid', 'electrolyte+fluid': '🧂💧 Electrolyte + Fluid' };
  return map[type] || type;
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ') : '';
}

const styles = {
  container: { maxWidth: 1000, margin: '0 auto' },
  heroBanner: {
    background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)',
    border: '1.5px solid #fed7aa', borderRadius: 16, padding: '28px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    boxShadow: '0 2px 16px rgba(249,115,22,0.08)',
  },
  heroLeft: {},
  heroSubtitle: { fontSize: 13, color: '#f97316', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  heroDetail: { fontSize: 14, color: '#64748b' },
  restartBtn: { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 20px', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  physioNote: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
    background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10,
    padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', lineHeight: 1.5,
  },
  physioIcon: { fontSize: 16, flexShrink: 0 },
  sweatTestBadge: {
    marginLeft: 8, background: '#dcfce7', border: '1px solid #86efac',
    borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: '#15803d',
    whiteSpace: 'nowrap',
  },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 },
  metricCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  metricIcon: { fontSize: 26, marginBottom: 4 },
  metricValue: { fontSize: 28, fontWeight: 800 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  metricSub: { fontSize: 11, color: '#94a3b8' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  section: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 22px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineSection: { marginBottom: 8 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f1f5f9', borderRadius: 8, padding: '7px 12px',
    marginBottom: 12, marginLeft: 0,
  },
  sectionHeaderIcon: { fontSize: 16 },
  sectionHeaderLabel: { fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timelineRow: { display: 'flex', gap: 14, paddingBottom: 14, borderLeft: '2px solid #e2e8f0', paddingLeft: 14, position: 'relative', marginLeft: 8 },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: '#f97316', position: 'absolute', left: -6, top: 4, flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 },
  timelineTime: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  timelineNote: { fontSize: 11, color: '#94a3b8' },
  timelineNums: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  productList: { display: 'flex', flexDirection: 'column', gap: 12 },
  productCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 14px', position: 'relative', cursor: 'default' },
  productTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  productName: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  productType: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  productBrand: { fontWeight: 600, color: '#64748b' },

  // Nutrition Facts tooltip
  nutritionTooltip: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '12px 14px', marginBottom: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    animation: 'fadeIn 0.15s ease',
  },
  nfTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, borderBottom: '2px solid #0f172a', paddingBottom: 6 },
  nfServing: { fontSize: 11, fontWeight: 400, color: '#94a3b8' },
  nfGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  nfRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid #f1f5f9' },
  nfLabel: { fontSize: 12, color: '#64748b' },
  nfValue: { fontSize: 13, fontWeight: 700 },
  productQty: { background: '#f97316', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 800 },
  productReason: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  productUsage: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 12, fontWeight: 600, color: '#16a34a' },
  productLink: { fontSize: 12, color: '#f97316', textDecoration: 'none', fontWeight: 600 },
  tipList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  tipItem: { display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 },
  segGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  segCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 14px' },
  segTop: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
  segIcon: { fontSize: 22 },
  segName: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  segDur: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  segNums: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  segNote: { fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 },
  tipBullet: { color: '#f97316', fontWeight: 700, flexShrink: 0 },
  ctaBanner: {
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    borderRadius: 14, padding: '24px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
  },
  ctaTitle: { fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 },
  ctaDesc: { fontSize: 14, color: '#fed7aa' },
  ctaBtn: { background: '#fff', color: '#ea580c', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  disclaimer: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 },
};
