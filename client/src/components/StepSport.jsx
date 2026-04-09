import { useLang } from '../LangContext';

export default function StepSport({ form, update, next }) {
  const { t } = useLang();

  const SPORTS = [
    { id: 'running',   icon: '🏃', labelKey: 'sport_running',   descKey: 'sport_running_desc' },
    { id: 'cycling',   icon: '🚴', labelKey: 'sport_cycling',   descKey: 'sport_cycling_desc' },
    { id: 'triathlon', icon: '🏊', labelKey: 'sport_triathlon', descKey: 'sport_triathlon_desc' },
    { id: 'swimming',  icon: '🏊', labelKey: 'sport_swimming',  descKey: 'sport_swimming_desc' },
    { id: 'other',     icon: '⚡', labelKey: 'sport_other',     descKey: 'sport_other_desc' },
  ];

  const select = (id) => { update({ sport: id }); setTimeout(next, 200); };

  return (
    <div style={styles.container}>
      <div className="step-card">
        <h1 style={styles.title}>{t('sport_title')}</h1>
        <p style={styles.subtitle}>{t('sport_subtitle')}</p>
        <div className="sports-grid">
          {SPORTS.map(s => (
            <button key={s.id} onClick={() => select(s.id)} style={{
              ...styles.sportBtn,
              ...(form.sport === s.id ? styles.sportBtnActive : {}),
            }}>
              <span style={styles.sportIcon}>{s.icon}</span>
              <span style={styles.sportLabel}>{t(s.labelKey)}</span>
              <span style={styles.sportDesc}>{t(s.descKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  title:    { fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 28 },
  sportBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12,
    padding: '18px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8, transition: 'all 0.2s', color: '#0f172a', width: '100%',
  },
  sportBtnActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 10px rgba(249,115,22,0.15)' },
  sportIcon:  { fontSize: 32 },
  sportLabel: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  sportDesc:  { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
};
