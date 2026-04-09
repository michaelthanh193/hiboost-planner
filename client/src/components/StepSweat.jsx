import { useState } from 'react';
import { useLang } from '../LangContext';

export default function StepSweat({ form, update, back, next }) {
  const { t } = useLang();
  const [useSweatTest, setUseSweatTest] = useState(!!(form.sweatRateMlHr || form.sweatSodiumMgL));

  const toggleSweatTest = () => {
    const n = !useSweatTest;
    setUseSweatTest(n);
    if (!n) update({ sweatRateMlHr: '', sweatSodiumMgL: '' });
  };

  const SWEAT_OPTIONS = [
    { id: 'low',       icon: '💧',  labelKey: 'sweat_low',       descKey: 'sweat_low_desc' },
    { id: 'medium',    icon: '💦',  labelKey: 'sweat_medium',    descKey: 'sweat_medium_desc' },
    { id: 'high',      icon: '🌊',  labelKey: 'sweat_high',      descKey: 'sweat_high_desc' },
    { id: 'very_high', icon: '🫗',  labelKey: 'sweat_very_high', descKey: 'sweat_very_high_desc' },
  ];
  const SALT_OPTIONS = [
    { id: 'low',       labelKey: 'salt_low',       descKey: 'salt_low_desc' },
    { id: 'medium',    labelKey: 'salt_medium',    descKey: 'salt_medium_desc' },
    { id: 'high',      labelKey: 'salt_high',      descKey: 'salt_high_desc' },
    { id: 'very_high', labelKey: 'salt_very_high', descKey: 'salt_very_high_desc' },
  ];
  const TEMP_OPTIONS = [
    { id: 'cold',     icon: '🧊',   label: '< 10°C',   desc: 'Very cold' },
    { id: 'cool',     icon: '🌤',   label: '10–15°C',  desc: 'Cool' },
    { id: 'mild',     icon: '☀️',   label: '15–20°C',  desc: 'Mild' },
    { id: 'warm',     icon: '🌡',   label: '20–25°C',  desc: 'Warm' },
    { id: 'hot',      icon: '🔥',   label: '25–30°C',  desc: 'Hot' },
    { id: 'very_hot', icon: '☀️🔥', label: '> 30°C',   desc: 'Very hot' },
  ];

  return (
    <div style={styles.container}>
      <div className="step-card">
        <h1 style={styles.title}>{t('sweat_title')}</h1>
        <p style={styles.subtitle}>
          {t('sweat_subtitle')}
          <em style={styles.analogy}>{t('sweat_analogy')}</em>
        </p>

        {/* Sweat test banner */}
        <div style={styles.sweatTestBanner}>
          <div style={styles.sweatTestHeader}>
            <div>
              <div style={styles.sweatTestTitle}>{t('sweat_test_title')}</div>
              <div style={styles.sweatTestDesc}>{t('sweat_test_desc')}</div>
            </div>
            <button onClick={toggleSweatTest}
              style={{ ...styles.toggleBtn, ...(useSweatTest ? styles.toggleActive : {}) }}>
              {useSweatTest ? t('sweat_test_active') : t('sweat_test_btn')}
            </button>
          </div>
          {useSweatTest && (
            <div className="sweat-test-fields">
              <div style={styles.testField}>
                <label style={styles.testLabel}>{t('sweat_rate_label')}</label>
                <div style={styles.testInputRow}>
                  <input style={styles.testInput} type="number" min="200" max="3000" placeholder="1200"
                    value={form.sweatRateMlHr || ''} onChange={e => update({ sweatRateMlHr: e.target.value })} />
                  <span style={styles.testUnit}>{t('sweat_rate_unit')}</span>
                </div>
                <p style={styles.testHint}>{t('sweat_rate_hint')}</p>
              </div>
              <div style={styles.testField}>
                <label style={styles.testLabel}>{t('sweat_sodium_label')}</label>
                <div style={styles.testInputRow}>
                  <input style={styles.testInput} type="number" min="200" max="2500" placeholder="950"
                    value={form.sweatSodiumMgL || ''} onChange={e => update({ sweatSodiumMgL: e.target.value })} />
                  <span style={styles.testUnit}>{t('sweat_sodium_unit')}</span>
                </div>
                <p style={styles.testHint}>{t('sweat_sodium_hint')}</p>
              </div>
              {form.sweatRateMlHr && form.sweatSodiumMgL && (
                <div style={{ ...styles.testPreview, gridColumn: '1 / -1' }}>
                  <span>✅</span>
                  <span>Your plan will use <strong>{form.sweatRateMlHr} ml/hr</strong> sweat rate and <strong>{form.sweatSodiumMgL} mg/L</strong> sodium.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sweat level */}
        <Section label={t('sweat_level_q')} dimmed={useSweatTest && !!form.sweatRateMlHr} override={t('sweat_override')}>
          <div className="option-grid" style={styles.optionGrid}>
            {SWEAT_OPTIONS.map(o => (
              <OptionBtn key={o.id} icon={o.icon} label={t(o.labelKey)} desc={t(o.descKey)}
                selected={form.sweatLevel === o.id} onSelect={() => update({ sweatLevel: o.id })}
                dimmed={useSweatTest && !!form.sweatRateMlHr} />
            ))}
          </div>
        </Section>

        {/* Saltiness */}
        <Section label={t('sweat_salt_q')} dimmed={useSweatTest && !!form.sweatSodiumMgL} override={t('sweat_override')}>
          <div className="option-grid" style={styles.optionGrid}>
            {SALT_OPTIONS.map(o => (
              <OptionBtn key={o.id} label={t(o.labelKey)} desc={t(o.descKey)}
                selected={form.saltiness === o.id} onSelect={() => update({ saltiness: o.id })}
                dimmed={useSweatTest && !!form.sweatSodiumMgL} />
            ))}
          </div>
        </Section>

        {/* Temperature */}
        <Section label={t('sweat_temp_q')}>
          <div className="temp-grid">
            {TEMP_OPTIONS.map(o => (
              <button key={o.id} onClick={() => update({ temperature: o.id })}
                style={{ ...styles.tempBtn, ...(form.temperature === o.id ? styles.tempActive : {}) }}>
                <span style={styles.tempIcon}>{o.icon}</span>
                <span style={styles.tempLabel}>{o.label}</span>
                <span style={styles.tempDesc}>{o.desc}</span>
              </button>
            ))}
          </div>
        </Section>

        <div className="nav-row">
          <button style={styles.backBtn} onClick={back}>{t('back')}</button>
          <button style={styles.submitBtn} onClick={next}>{t('continue')}</button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children, dimmed, override }) {
  return (
    <div style={{ ...styles.section, opacity: dimmed ? 0.45 : 1, pointerEvents: dimmed ? 'none' : 'auto' }}>
      <label style={styles.sectionLabel}>
        {label}
        {dimmed && <span style={styles.overrideBadge}> {override}</span>}
      </label>
      {children}
    </div>
  );
}

function OptionBtn({ icon, label, desc, selected, onSelect, dimmed }) {
  return (
    <button onClick={onSelect} disabled={dimmed}
      style={{ ...styles.optionBtn, ...(selected ? styles.optionActive : {}) }}>
      {icon && <span style={styles.optionIcon}>{icon}</span>}
      <span style={styles.optionLabel}>{label}</span>
      <span style={styles.optionDesc}>{desc}</span>
    </button>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 22, lineHeight: 1.6 },
  analogy: { display: 'block', marginTop: 6, color: '#94a3b8', fontStyle: 'italic' },
  sweatTestBanner: { background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 18px', marginBottom: 24 },
  sweatTestHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sweatTestTitle: { fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 4 },
  sweatTestDesc: { fontSize: 12, color: '#15803d', lineHeight: 1.5 },
  toggleBtn: { flexShrink: 0, background: '#fff', border: '1.5px solid #86efac', borderRadius: 8, padding: '8px 14px', color: '#166534', cursor: 'pointer', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' },
  toggleActive: { background: '#16a34a', color: '#fff', border: '1.5px solid #16a34a' },
  testField: { display: 'flex', flexDirection: 'column', gap: 6 },
  testLabel: { fontSize: 13, fontWeight: 700, color: '#166534' },
  testInputRow: { display: 'flex', alignItems: 'center', gap: 8 },
  testInput: { background: '#fff', border: '1.5px solid #86efac', borderRadius: 8, padding: '10px 12px', color: '#0f172a', fontSize: 18, fontWeight: 700, outline: 'none', width: 120 },
  testUnit: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  testHint: { fontSize: 11, color: '#64748b', margin: 0 },
  testPreview: { display: 'flex', alignItems: 'center', gap: 8, background: '#dcfce7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' },
  overrideBadge: { fontSize: 11, color: '#16a34a', fontWeight: 500 },
  section: { marginBottom: 24, transition: 'opacity 0.2s' },
  sectionLabel: { display: 'block', fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 12 },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 },
  optionBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '14px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    gap: 4, textAlign: 'left', transition: 'all 0.2s', width: '100%',
  },
  optionActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  optionIcon: { fontSize: 22 },
  optionLabel: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  optionDesc: { fontSize: 11, color: '#94a3b8' },
  tempBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '12px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    gap: 3, alignItems: 'center', transition: 'all 0.2s', width: '100%',
  },
  tempActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  tempIcon: { fontSize: 20 },
  tempLabel: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  tempDesc: { fontSize: 11, color: '#94a3b8' },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  submitBtn: { background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: 8, padding: '14px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 12px rgba(249,115,22,0.35)' },
};
