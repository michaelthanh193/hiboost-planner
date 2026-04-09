import { useLang } from '../LangContext';

export default function StepBody({ form, update, next, back }) {
  const { t } = useLang();

  const canContinue = form.bodyWeightKg && parseFloat(form.bodyWeightKg) >= 30
    && form.gender
    && form.age && parseInt(form.age) >= 10 && parseInt(form.age) <= 100;

  const age = parseInt(form.age) || 0;
  const ageGroup = age < 20 ? 'youth' : age < 35 ? 'open' : age < 50 ? 'masters' : 'senior';
  const ageNote = {
    youth: t('body_age_youth'), open: t('body_age_open'),
    masters: t('body_age_masters'), senior: t('body_age_senior'),
  }[ageGroup];

  const genders = [
    { id: 'male',   icon: '♂', labelKey: 'body_male',   descKey: 'body_male_desc' },
    { id: 'female', icon: '♀', labelKey: 'body_female', descKey: 'body_female_desc' },
  ];
  const experiences = [
    { id: 'beginner',     labelKey: 'body_beginner',     descKey: 'body_beginner_desc' },
    { id: 'intermediate', labelKey: 'body_intermediate', descKey: 'body_intermediate_desc' },
    { id: 'advanced',     labelKey: 'body_advanced',     descKey: 'body_advanced_desc' },
  ];

  return (
    <div style={styles.container}>
      <div className="step-card">
        <h1 style={styles.title}>{t('body_title')}</h1>
        <p style={styles.subtitle}>{t('body_subtitle')}</p>

        {/* Gender */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{t('body_gender')}</label>
          <div className="gender-row">
            {genders.map(g => (
              <button key={g.id} onClick={() => update({ gender: g.id })}
                style={{ ...styles.genderBtn, ...(form.gender === g.id ? styles.genderActive : {}) }}>
                <span style={{ ...styles.genderIcon, color: form.gender === g.id ? '#f97316' : '#94a3b8' }}>{g.icon}</span>
                <span style={styles.genderLabel}>{t(g.labelKey)}</span>
                <span style={styles.genderDesc}>{t(g.descKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{t('body_age')}</label>
          <div style={styles.ageRow}>
            <input style={styles.ageInput} type="number" min="10" max="100" placeholder="30"
              value={form.age} onChange={e => update({ age: e.target.value })} />
            <span style={styles.unit}>{t('body_age_unit')}</span>
          </div>
          {age >= 10 && age <= 100 && <div style={styles.ageTag}>{ageNote}</div>}
        </div>

        {/* Weight */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{t('body_weight')}</label>
          <div style={styles.weightRow}>
            <input style={styles.input} type="number" min="30" max="200" placeholder="70"
              value={form.bodyWeightKg} onChange={e => update({ bodyWeightKg: e.target.value })} />
            <span style={styles.unit}>{t('body_weight_unit')}</span>
          </div>
          <p style={styles.hint}>{t('body_weight_hint')}</p>
        </div>

        {/* Experience */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>{t('body_experience')}</label>
          <div className="radio-group">
            {experiences.map(opt => (
              <button key={opt.id} onClick={() => update({ experience: opt.id })}
                style={{ ...styles.radioBtn, ...(form.experience === opt.id ? styles.radioBtnActive : {}) }}>
                <span style={styles.radioLabel}>{t(opt.labelKey)}</span>
                <span style={styles.radioDesc}>{t(opt.descKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="nav-row">
          <button style={styles.backBtn} onClick={back}>{t('back')}</button>
          <button style={{ ...styles.nextBtn, opacity: canContinue ? 1 : 0.4 }}
            onClick={next} disabled={!canContinue}>{t('continue')}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 28 },
  fieldGroup: { marginBottom: 24 },
  label: { display: 'block', fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 10 },
  genderBtn: {
    flex: 1, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12,
    padding: '16px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: 4, transition: 'all 0.2s',
  },
  genderActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  genderIcon: { fontSize: 26, fontWeight: 700 },
  genderLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  genderDesc: { fontSize: 11, color: '#94a3b8' },
  ageRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  ageInput: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', color: '#0f172a', fontSize: 20, fontWeight: 700, outline: 'none', width: 110 },
  ageTag: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#166534', fontWeight: 500 },
  weightRow: { display: 'flex', alignItems: 'center', gap: 10 },
  input: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', color: '#0f172a', fontSize: 20, fontWeight: 700, outline: 'none', width: 120 },
  unit: { fontSize: 16, color: '#94a3b8' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  radioBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '14px 12px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column',
    gap: 4, textAlign: 'left', transition: 'all 0.2s',
  },
  radioBtnActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  radioLabel: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  radioDesc: { fontSize: 11, color: '#94a3b8' },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  nextBtn: { background: '#f97316', border: 'none', borderRadius: 8, padding: '12px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 8px rgba(249,115,22,0.3)' },
};
