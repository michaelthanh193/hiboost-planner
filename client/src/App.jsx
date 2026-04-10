import { useState } from 'react';
import StepSport from './components/StepSport';
import StepEvent from './components/StepEvent';
import StepSplits from './components/StepSplits';
import StepBody from './components/StepBody';
import StepSweat from './components/StepSweat';
import StepContact from './components/StepContact';
import Results from './components/Results';
import { useLang } from './LangContext';

const BASE_STEPS_KEYS = ['stepSport', 'stepEvent', 'stepBody', 'stepSweat', 'stepContact', 'stepPlan'];
const TRI_STEPS_KEYS  = ['stepSport', 'stepEvent', 'stepSplits', 'stepBody', 'stepSweat', 'stepContact', 'stepPlan'];

const initialForm = {
  sport: '', eventName: '', durationHrs: '', distanceKm: '',
  bodyWeightKg: '', gender: '', age: '',
  sweatLevel: 'medium', saltiness: 'medium', temperature: 'warm',
  sweatRateMlHr: '', sweatSodiumMgL: '', splits: null, fuelPreference: 'mixed',
  firstName: '', lastName: '', email: '', phone: '',
};

export default function App() {
  const { t } = useLang();
  const [step, setStep]     = useState(0);
  const [form, setForm]     = useState(initialForm);
  const [plan, setPlan]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const isTri  = form.sport === 'triathlon';
  const KEYS   = isTri ? TRI_STEPS_KEYS : BASE_STEPS_KEYS;
  const STEPS  = KEYS.map(k => t(k));

  const update = (fields) => setForm(prev => ({ ...prev, ...fields }));
  const next   = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back   = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone,
          sport: form.sport, eventName: form.eventName, durationHrs: form.durationHrs,
        }),
      }).catch(() => {});

      const res  = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: form.sport, durationHrs: parseFloat(form.durationHrs),
          bodyWeightKg: parseFloat(form.bodyWeightKg),
          gender: form.gender || 'male', age: parseInt(form.age) || 30,
          sweatLevel: form.sweatLevel, saltiness: form.saltiness, temperature: form.temperature,
          sweatRateMlHr: form.sweatRateMlHr ? parseFloat(form.sweatRateMlHr) : null,
          sweatSodiumMgL: form.sweatSodiumMgL ? parseFloat(form.sweatSodiumMgL) : null,
          experience: form.experience, splits: form.splits || null,
          fuelPreference: form.fuelPreference || 'mixed',
        }),
      });

      const text = await res.text();
      if (!text || text.trim() === '') throw new Error('Server không phản hồi. Hãy thử lại.');
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('Server lỗi: ' + text.slice(0, 100)); }
      if (!res.ok) throw new Error(data.error || 'Tính toán thất bại');
      setPlan(data.plan);
      setStep(STEPS.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restart = () => { setForm(initialForm); setPlan(null); setError(null); setStep(0); };

  return (
    <div style={styles.app}>
      <Header />
      <ProgressBar step={step} steps={STEPS} />
      <main className="app-main">
        {step === 0 && <StepSport form={form} update={update} next={next} />}
        {step === 1 && <StepEvent form={form} update={update} next={next} back={back} />}
        {isTri && step === 2 && <StepSplits form={form} update={update} next={next} back={back} />}
        {step === (isTri ? 3 : 2) && <StepBody form={form} update={update} next={next} back={back} />}
        {step === (isTri ? 4 : 3) && <StepSweat form={form} update={update} back={back} next={next} />}
        {step === (isTri ? 5 : 4) && (
          <StepContact form={form} update={update} back={back} submit={submit} loading={loading} error={error} />
        )}
        {step === (isTri ? 6 : 5) && plan && <Results plan={plan} form={form} restart={restart} />}
      </main>
      <footer style={styles.footer}>
        <p>Powered by <a href="https://www.hiboostnutrition.com" style={styles.link} target="_blank" rel="noreferrer">HiBoost Nutrition</a> · <span>{t('footer')}</span></p>
      </footer>
    </div>
  );
}

function Header() {
  const { lang, setLang, t } = useLang();
  return (
    <header style={styles.header}>
      <div className="header-inner" style={styles.headerInnerBase}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <img src="/logo.svg" alt="HiBoost" style={{ height: 32 }} />
          <span className="logo-sub" style={styles.logoSub}>Nutrition Planner</span>
        </div>
        <div style={styles.headerRight}>
          {/* Language toggle */}
          <div style={styles.langToggle}>
            <button
              className="lang-btn"
              onClick={() => setLang('en')}
              style={{ ...styles.langBtn, ...(lang === 'en' ? styles.langBtnActive : {}) }}
              title="English"
            >EN</button>
            <span style={styles.langDivider}>|</span>
            <button
              className="lang-btn"
              onClick={() => setLang('vi')}
              style={{ ...styles.langBtn, ...(lang === 'vi' ? styles.langBtnActive : {}) }}
              title="Tiếng Việt"
            >VI</button>
          </div>
          <a href="https://www.hiboostnutrition.com/shop" target="_blank" rel="noreferrer" className="shop-btn" style={styles.shopBtn}>
            {t('shopBtn')}
          </a>
        </div>
      </div>
    </header>
  );
}

function ProgressBar({ step, steps }) {
  return (
    <div style={styles.progressWrap}>
      <div className="progress-inner">
        {steps.map((label, i) => (
          <div key={i} style={styles.progressItem}>
            <div className="progress-dot" style={{
              ...styles.progressDot,
              background: i < step ? '#22c55e' : i === step ? '#f97316' : '#e2e8f0',
              border: i === step ? '2px solid #f97316' : i < step ? '2px solid #22c55e' : '2px solid #cbd5e1',
              color: i < step || i === step ? '#fff' : '#94a3b8',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className="progress-label" style={{
              ...styles.progressLabel,
              color: i === step ? '#f97316' : i < step ? '#16a34a' : '#94a3b8',
            }}>{label}</span>
          </div>
        ))}
        <div style={styles.progressLine}>
          <div style={{ ...styles.progressFill, width: `${(step / (steps.length - 1)) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' },
  header: { background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 },
  headerInnerBase: { maxWidth: 900, margin: '0 auto' },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 22, fontWeight: 800, color: '#f97316', letterSpacing: '-0.5px' },
  logoSub: { fontSize: 13, color: '#94a3b8', marginLeft: 4, fontWeight: 500 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  langToggle: { display: 'flex', alignItems: 'center', gap: 2 },
  langBtn: {
    background: 'none', border: 'none', padding: '4px 8px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#94a3b8',
    transition: 'color 0.2s', letterSpacing: '0.5px',
  },
  langBtnActive: { color: '#f97316' },
  langDivider: { fontSize: 12, color: '#e2e8f0', userSelect: 'none' },
  shopBtn: {
    background: '#f97316', color: '#fff', padding: '8px 16px', borderRadius: 8,
    textDecoration: 'none', fontSize: 13, fontWeight: 600,
    boxShadow: '0 2px 8px rgba(249,115,22,0.25)', whiteSpace: 'nowrap',
  },
  progressWrap: { background: '#fff', padding: '16px 16px 0', borderBottom: '1px solid #e2e8f0' },
  progressItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1 },
  progressDot: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, transition: 'all 0.3s', color: '#fff' },
  progressLabel: { fontSize: 11, fontWeight: 500, transition: 'color 0.3s', whiteSpace: 'nowrap' },
  progressLine: { position: 'absolute', top: 16, left: '5%', right: '5%', height: 2, background: '#e2e8f0', zIndex: 0 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #22c55e, #f97316)', transition: 'width 0.4s ease', borderRadius: 2 },
  footer: { padding: '16px', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 12 },
  link: { color: '#f97316', textDecoration: 'none' },
};
