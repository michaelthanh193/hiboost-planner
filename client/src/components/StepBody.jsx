export default function StepBody({ form, update, next, back }) {
  const canContinue = form.bodyWeightKg && parseFloat(form.bodyWeightKg) >= 30
    && form.gender
    && form.age && parseInt(form.age) >= 10 && parseInt(form.age) <= 100;

  const age = parseInt(form.age) || 0;
  const ageGroup = age < 20 ? 'youth' : age < 35 ? 'open' : age < 50 ? 'masters' : 'senior';
  const ageNote = {
    youth:   '🌱 Under 20: Growth phase — carb needs are higher relative to weight.',
    open:    '⚡ Age 20–34: Peak performance range. Baseline carb & fluid targets.',
    masters: '🏅 Age 35–49: Slightly reduced carb capacity. Recovery nutrition matters more.',
    senior:  '💪 Age 50+: Protein timing and electrolytes become more critical.',
  }[ageGroup];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>About You</h1>
        <p style={styles.subtitle}>Gender and age help us personalise carb, fluid, and sodium targets for your physiology.</p>

        {/* ── Gender ── */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Gender</label>
          <div style={styles.genderRow}>
            {[
              { id: 'male',   icon: '♂', label: 'Male',   desc: 'Higher sweat rate & carb needs on average' },
              { id: 'female', icon: '♀', label: 'Female', desc: 'Lower baseline; hormonal cycle can affect needs' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => update({ gender: g.id })}
                style={{ ...styles.genderBtn, ...(form.gender === g.id ? styles.genderActive : {}) }}
              >
                <span style={{ ...styles.genderIcon, color: form.gender === g.id ? '#f97316' : '#94a3b8' }}>{g.icon}</span>
                <span style={styles.genderLabel}>{g.label}</span>
                <span style={styles.genderDesc}>{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Age ── */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Age</label>
          <div style={styles.ageRow}>
            <input
              style={styles.ageInput}
              type="number"
              min="10"
              max="100"
              placeholder="30"
              value={form.age}
              onChange={e => update({ age: e.target.value })}
            />
            <span style={styles.unit}>years</span>
          </div>
          {age >= 10 && age <= 100 && (
            <div style={styles.ageTag}>{ageNote}</div>
          )}
        </div>

        {/* ── Body Weight ── */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Body Weight</label>
          <div style={styles.weightRow}>
            <input
              style={styles.input}
              type="number"
              min="30"
              max="200"
              placeholder="70"
              value={form.bodyWeightKg}
              onChange={e => update({ bodyWeightKg: e.target.value })}
            />
            <span style={styles.unit}>kg</span>
          </div>
          <p style={styles.hint}>Used to scale carbohydrate targets via allometric formula (weight^0.75).</p>
        </div>

        {/* ── Experience ── */}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Experience Level</label>
          <div style={styles.radioGroup}>
            {[
              { id: 'beginner',     label: 'Beginner',     desc: 'First or second race' },
              { id: 'intermediate', label: 'Intermediate', desc: '1–3 years racing' },
              { id: 'advanced',     label: 'Advanced',     desc: '3+ years, regular competitor' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => update({ experience: opt.id })}
                style={{ ...styles.radioBtn, ...(form.experience === opt.id ? styles.radioBtnActive : {}) }}
              >
                <span style={styles.radioLabel}>{opt.label}</span>
                <span style={styles.radioDesc}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.navRow}>
          <button style={styles.backBtn} onClick={back}>← Back</button>
          <button
            style={{ ...styles.nextBtn, opacity: canContinue ? 1 : 0.4 }}
            onClick={next}
            disabled={!canContinue}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 32 },
  fieldGroup: { marginBottom: 26 },
  label: { display: 'block', fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 10 },

  // Gender
  genderRow: { display: 'flex', gap: 14 },
  genderBtn: {
    flex: 1, background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12,
    padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', gap: 4, transition: 'all 0.2s',
  },
  genderActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  genderIcon: { fontSize: 26, fontWeight: 700 },
  genderLabel: { fontSize: 15, fontWeight: 700, color: '#1e293b' },
  genderDesc: { fontSize: 12, color: '#94a3b8' },

  // Age
  ageRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  ageInput: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', color: '#0f172a', fontSize: 20, fontWeight: 700, outline: 'none', width: 110 },
  ageTag: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#166534', fontWeight: 500 },

  // Weight
  weightRow: { display: 'flex', alignItems: 'center', gap: 10 },
  input: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', color: '#0f172a', fontSize: 20, fontWeight: 700, outline: 'none', width: 120 },
  unit: { fontSize: 16, color: '#94a3b8' },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 8 },

  // Experience
  radioGroup: { display: 'flex', gap: 12 },
  radioBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 10,
    padding: '14px 16px', cursor: 'pointer', flex: 1, display: 'flex', flexDirection: 'column', gap: 4,
    textAlign: 'left', transition: 'all 0.2s',
  },
  radioBtnActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.12)' },
  radioLabel: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  radioDesc: { fontSize: 12, color: '#94a3b8' },

  // Nav
  navRow: { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  nextBtn: { background: '#f97316', border: 'none', borderRadius: 8, padding: '12px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 8px rgba(249,115,22,0.3)' },
};
