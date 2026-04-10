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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/logo.svg" alt="HiBoost" style={{ height: 42, objectFit: 'contain' }} />
          <div className="logo-divider" style={{ width: 1, height: 24, background: '#cbd5e1' }}></div>
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
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafaf9', fontFamily: '"Inter", system-ui, sans-serif' },
  header: { 
    background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 20px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 100 
  },
  headerInnerBase: { maxWidth: 1024, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logoSub: { fontSize: 16, color: '#475569', fontWeight: 600, letterSpacing: '-0.3px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  langToggle: { display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px', borderRadius: 20 },
  langBtn: {
    background: 'none', border: 'none', padding: '6px 12px', borderRadius: 16,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#64748b',
    transition: 'all 0.2s ease', letterSpacing: '0.4px',
  },
  langBtnActive: { color: '#f97316', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  shopBtn: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff', 
    padding: '10px 20px', borderRadius: 24, textDecoration: 'none', 
    fontSize: 14, fontWeight: 600, boxShadow: '0 4px 14px rgba(234,88,12,0.3)', 
    whiteSpace: 'nowrap', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  progressWrap: { background: 'transparent', padding: '24px 20px 0' },
  progressItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 },
  progressDot: { 
    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
    color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  progressLabel: { fontSize: 12, fontWeight: 600, transition: 'color 0.4s ease', whiteSpace: 'nowrap' },
  progressLine: { position: 'absolute', top: 18, left: '5%', right: '5%', height: 3, background: '#e2e8f0', zIndex: 0, borderRadius: 3 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #f97316, #ea580c)', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: 3 },
  footer: { padding: '24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13, background: '#fff' },
  link: { color: '#ea580c', textDecoration: 'none', fontWeight: 500 },
};
