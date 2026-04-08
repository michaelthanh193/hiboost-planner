const SPORTS = [
  { id: 'running', icon: '🏃', label: 'Running', desc: 'Road, trail, track' },
  { id: 'cycling', icon: '🚴', label: 'Cycling', desc: 'Road, gravel, MTB' },
  { id: 'triathlon', icon: '🏊', label: 'Triathlon', desc: 'Sprint to Ironman' },
  { id: 'swimming', icon: '🏊', label: 'Swimming', desc: 'Open water or pool' },
  { id: 'other', icon: '⚡', label: 'Other', desc: 'Team sports, CrossFit, etc.' },
];

export default function StepSport({ form, update, next }) {
  const select = (id) => {
    update({ sport: id });
    setTimeout(next, 200);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>What sport are you planning for?</h1>
        <p style={styles.subtitle}>We'll tailor your nutrition and hydration plan to your event.</p>
        <div style={styles.grid}>
          {SPORTS.map(s => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              style={{
                ...styles.sportBtn,
                ...(form.sport === s.id ? styles.sportBtnActive : {}),
              }}
            >
              <span style={styles.sportIcon}>{s.icon}</span>
              <span style={styles.sportLabel}>{s.label}</span>
              <span style={styles.sportDesc}>{s.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 36 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  sportBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12,
    padding: '20px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8, transition: 'all 0.2s', color: '#0f172a',
  },
  sportBtnActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.15)' },
  sportIcon: { fontSize: 32 },
  sportLabel: { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  sportDesc: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
};
