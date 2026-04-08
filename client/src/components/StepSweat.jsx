import { useState } from 'react';

const SWEAT_OPTIONS = [
  { id: 'low',      icon: '💧',  label: 'Light sweater',    desc: 'Barely noticeable sweat even in heat' },
  { id: 'medium',   icon: '💦',  label: 'Moderate sweater', desc: 'Visible sweat, slight wet patches' },
  { id: 'high',     icon: '🌊',  label: 'Heavy sweater',    desc: 'Dripping sweat, soaked shirt' },
  { id: 'very_high',icon: '🫗',  label: 'Extreme sweater',  desc: 'Puddles forming beneath you' },
];

const SALT_OPTIONS = [
  { id: 'low',      label: 'Light/no residue',   desc: 'No white marks on skin or kit' },
  { id: 'medium',   label: 'Some white marks',   desc: 'Faint salt residue after long efforts' },
  { id: 'high',     label: 'Heavy salt residue', desc: 'Clear white crust on skin after sweating' },
  { id: 'very_high',label: 'Very salty',         desc: 'Burns eyes, heavy white crust everywhere' },
];

const TEMP_OPTIONS = [
  { id: 'cold',     icon: '🧊',    label: '< 10°C',   desc: 'Very cold' },
  { id: 'cool',     icon: '🌤',    label: '10–15°C',  desc: 'Cool' },
  { id: 'mild',     icon: '☀️',    label: '15–20°C',  desc: 'Mild' },
  { id: 'warm',     icon: '🌡',    label: '20–25°C',  desc: 'Warm' },
  { id: 'hot',      icon: '🔥',    label: '25–30°C',  desc: 'Hot' },
  { id: 'very_hot', icon: '☀️🔥',  label: '> 30°C',   desc: 'Very hot' },
];

export default function StepSweat({ form, update, back, next }) {
  const [useSweatTest, setUseSweatTest] = useState(
    !!(form.sweatRateMlHr || form.sweatSodiumMgL)
  );

  const toggleSweatTest = () => {
    const next = !useSweatTest;
    setUseSweatTest(next);
    if (!next) {
      // Clear test values when toggling off
      update({ sweatRateMlHr: '', sweatSodiumMgL: '' });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Your Sweat Profile</h1>
        <p style={styles.subtitle}>
          This is the most personalised part of your plan. Sweat rate and saltiness determine your fluid and sodium needs.
          <em style={styles.analogy}> Think of it like a car's fuel gauge — we need to know how fast your tank drains.</em>
        </p>

        {/* ── Optional Sweat Test Toggle ── */}
        <div style={styles.sweatTestBanner}>
          <div style={styles.sweatTestHeader}>
            <div>
              <div style={styles.sweatTestTitle}>🧪 Have your own sweat test data?</div>
              <div style={styles.sweatTestDesc}>
                If you've done a sweat test (e.g. via Precision Hydration, Supersapiens, or a lab), enter your exact numbers for a more accurate plan.
              </div>
            </div>
            <button
              onClick={toggleSweatTest}
              style={{ ...styles.toggleBtn, ...(useSweatTest ? styles.toggleActive : {}) }}
            >
              {useSweatTest ? '✓ Using test data' : 'Enter test data'}
            </button>
          </div>

          {useSweatTest && (
            <div style={styles.sweatTestFields}>
              <div style={styles.testField}>
                <label style={styles.testLabel}>Sweat Rate</label>
                <div style={styles.testInputRow}>
                  <input
                    style={styles.testInput}
                    type="number"
                    min="200"
                    max="3000"
                    placeholder="e.g. 1200"
                    value={form.sweatRateMlHr || ''}
                    onChange={e => update({ sweatRateMlHr: e.target.value })}
                  />
                  <span style={styles.testUnit}>ml / hr</span>
                </div>
                <p style={styles.testHint}>Measured as weight lost per hour of exercise (e.g. 1.2 kg/hr = 1200 ml/hr)</p>
              </div>
              <div style={styles.testField}>
                <label style={styles.testLabel}>Sweat Sodium Concentration</label>
                <div style={styles.testInputRow}>
                  <input
                    style={styles.testInput}
                    type="number"
                    min="200"
                    max="2500"
                    placeholder="e.g. 950"
                    value={form.sweatSodiumMgL || ''}
                    onChange={e => update({ sweatSodiumMgL: e.target.value })}
                  />
                  <span style={styles.testUnit}>mg / L</span>
                </div>
                <p style={styles.testHint}>From a sweat patch or lab test. Typical range: 400–1800 mg/L.</p>
              </div>
              {form.sweatRateMlHr && form.sweatSodiumMgL && (
                <div style={styles.testPreview}>
                  <span style={styles.testPreviewIcon}>✅</span>
                  <span>
                    Your plan will use <strong>{form.sweatRateMlHr} ml/hr</strong> sweat rate and <strong>{form.sweatSodiumMgL} mg/L</strong> sodium — overriding the estimates below.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sweat Rate (estimated) — greyed out when test data entered ── */}
        <Section label="How much do you typically sweat?" dimmed={useSweatTest && !!form.sweatRateMlHr}>
          <div style={styles.optionGrid}>
            {SWEAT_OPTIONS.map(o => (
              <OptionBtn
                key={o.id}
                option={o}
                selected={form.sweatLevel === o.id}
                onSelect={() => update({ sweatLevel: o.id })}
                dimmed={useSweatTest && !!form.sweatRateMlHr}
              />
            ))}
          </div>
        </Section>

        {/* ── Saltiness (estimated) — greyed out when test data entered ── */}
        <Section label="How salty is your sweat? (white residue on skin or kit)" dimmed={useSweatTest && !!form.sweatSodiumMgL}>
          <div style={styles.optionGrid}>
            {SALT_OPTIONS.map(o => (
              <OptionBtn
                key={o.id}
                option={o}
                selected={form.saltiness === o.id}
                onSelect={() => update({ saltiness: o.id })}
                dimmed={useSweatTest && !!form.sweatSodiumMgL}
              />
            ))}
          </div>
        </Section>

        <Section label="Expected race temperature">
          <div style={styles.tempGrid}>
            {TEMP_OPTIONS.map(o => (
              <button
                key={o.id}
                onClick={() => update({ temperature: o.id })}
                style={{ ...styles.tempBtn, ...(form.temperature === o.id ? styles.tempActive : {}) }}
              >
                <span style={styles.tempIcon}>{o.icon}</span>
                <span style={styles.tempLabel}>{o.label}</span>
                <span style={styles.tempDesc}>{o.desc}</span>
              </button>
            ))}
          </div>
        </Section>

        <div style={styles.navRow}>
          <button style={styles.backBtn} onClick={back}>← Back</button>
          <button style={styles.submitBtn} onClick={next}>
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children, dimmed }) {
  return (
    <div style={{ ...styles.section, opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
      <label style={styles.sectionLabel}>
        {label}
        {dimmed && <span style={styles.overrideBadge}> · overridden by test data</span>}
      </label>
      {children}
    </div>
  );
}

function OptionBtn({ option, selected, onSelect, dimmed }) {
  return (
    <button
      onClick={onSelect}
      disabled={dimmed}
      style={{ ...styles.optionBtn, ...(selected ? styles.optionActive : {}) }}
    >
      {option.icon && <span style={styles.optionIcon}>{option.icon}</span>}
      <span style={styles.optionLabel}>{option.label}</span>
      <span style={styles.optionDesc}>{option.desc}</span>
    </button>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 24, lineHeight: 1.6 },
  analogy: { display: 'block', marginTop: 8, color: '#94a3b8', fontStyle: 'italic' },

  // Sweat test banner
  sweatTestBanner: { background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '18px 20px', marginBottom: 28 },
  sweatTestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  sweatTestTitle: { fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 4 },
  sweatTestDesc: { fontSize: 12, color: '#15803d', lineHeight: 1.5 },
  toggleBtn: { flexShrink: 0, background: '#fff', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 16px', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' },
  toggleActive: { background: '#16a34a', color: '#fff', border: '1.5px solid #16a34a' },

  sweatTestFields: { marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  testField: { display: 'flex', flexDirection: 'column', gap: 6 },
  testLabel: { fontSize: 13, fontWeight: 700, color: '#166534' },
  testInputRow: { display: 'flex', alignItems: 'center', gap: 8 },
  testInput: { background: '#fff', border: '1.5px solid #86efac', borderRadius: 8, padding: '10px 12px', color: '#0f172a', fontSize: 18, fontWeight: 700, outline: 'none', width: 120 },
  testUnit: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  testHint: { fontSize: 11, color: '#64748b', margin: 0 },
  testPreview: { gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' },
  testPreviewIcon: { fontSize: 16 },
  overrideBadge: { fontSize: 11, color: '#16a34a', fontWeight: 500 },

  section: { marginBottom: 28, transition: 'opacity 0.2s' },
  sectionLabel: { display: 'block', fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 12 },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 },
  optionBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
    textAlign: 'left', transition: 'all 0.2s',
  },
  optionActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  optionIcon: { fontSize: 22 },
  optionLabel: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  optionDesc: { fontSize: 11, color: '#94a3b8' },
  tempGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  tempBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '12px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3,
    alignItems: 'center', transition: 'all 0.2s',
  },
  tempActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  tempIcon: { fontSize: 20 },
  tempLabel: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  tempDesc: { fontSize: 11, color: '#94a3b8' },
  errorBanner: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14 },
  navRow: { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  submitBtn: { background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: 8, padding: '14px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 12px rgba(249,115,22,0.35)' },
};
