import { useEffect, useState } from 'react';

const DEFAULT_SPLITS = {
  // Super Sprint
  'Super Sprint':              { swim: 10, t1: 1,  bike: 25,  t2: 1,  run: 12  },
  // Sprint
  'Sprint Triathlon':          { swim: 15, t1: 2,  bike: 40,  t2: 1,  run: 17  },
  // Olympic (new label from catalog)
  'Olympic / Standard':        { swim: 22, t1: 2,  bike: 70,  t2: 1,  run: 40  },
  // Legacy label fallback
  'Olympic Triathlon':         { swim: 22, t1: 2,  bike: 70,  t2: 1,  run: 40  },
  // Half Ironman (new label from catalog)
  'Ironman 70.3':              { swim: 35, t1: 3,  bike: 160, t2: 2,  run: 100 },
  // Legacy label fallback
  '70.3 Half Ironman':         { swim: 35, t1: 3,  bike: 160, t2: 2,  run: 100 },
  // Full Ironman (new label from catalog)
  'Ironman 140.6':             { swim: 70, t1: 5,  bike: 340, t2: 3,  run: 182 },
  // Legacy label fallback
  'Ironman':                   { swim: 70, t1: 5,  bike: 340, t2: 3,  run: 182 },
  // Long Course
  'Long Course (226km)':       { swim: 75, t1: 5,  bike: 360, t2: 4,  run: 216 },
  // Double/Ultra
  'Double / Ultra Tri':        { swim: 140,t1: 10, bike: 720, t2: 8,  run: 440 },
};

function getDefaultSplits(eventName, totalMins) {
  if (DEFAULT_SPLITS[eventName]) return DEFAULT_SPLITS[eventName];
  return {
    swim: Math.round(totalMins * 0.11),
    t1:   Math.round(totalMins * 0.01),
    bike: Math.round(totalMins * 0.53),
    t2:   Math.round(totalMins * 0.01),
    run:  Math.round(totalMins * 0.34),
  };
}

const SEGMENTS = [
  { key: 'swim', icon: '🏊', label: 'Swim',            color: '#3b82f6', min: 5,  max: 120, step: 1 },
  { key: 't1',   icon: '👟', label: 'T1 (Transition)', color: '#8b5cf6', min: 1,  max: 20,  step: 1 },
  { key: 'bike', icon: '🚴', label: 'Bike',             color: '#f97316', min: 10, max: 600, step: 5 },
  { key: 't2',   icon: '👟', label: 'T2 (Transition)', color: '#8b5cf6', min: 1,  max: 20,  step: 1 },
  { key: 'run',  icon: '🏃', label: 'Run',              color: '#16a34a', min: 5,  max: 300, step: 1 },
];

function fmtMins(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min}min`;
  return min === 0 ? `${h}h` : `${h}h ${min}min`;
}

export default function StepSplits({ form, update, next, back }) {
  const [targetH, setTargetH] = useState(Math.floor(parseFloat(form.durationHrs || 0)));
  const [targetM, setTargetM] = useState(Math.round((parseFloat(form.durationHrs || 0) % 1) * 60));

  const totalMins = targetH * 60 + targetM;

  // Sync target back to form whenever it changes
  useEffect(() => {
    const hrs = totalMins / 60;
    if (hrs > 0) update({ durationHrs: hrs });
  }, [totalMins]);

  // Init splits once
  useEffect(() => {
    if (!form.splits) {
      update({ splits: getDefaultSplits(form.eventName, totalMins) });
    }
  }, []);

  const splits = form.splits || getDefaultSplits(form.eventName, totalMins);
  const setSplit = (key, val) => update({ splits: { ...splits, [key]: parseInt(val, 10) } });

  const splitsTotal = Object.values(splits).reduce((a, b) => a + b, 0);
  const diff = splitsTotal - totalMins;

  const statusColor = Math.abs(diff) <= 5 ? '#16a34a' : diff > 0 ? '#dc2626' : '#d97706';
  const statusMsg =
    Math.abs(diff) <= 5 ? '✅ Perfectly matched to your race time!' :
    diff > 0 ? `⚠️ ${diff} min over your target` :
               `⚠️ ${Math.abs(diff)} min under your target`;

  const pct = totalMins > 0 ? Math.min((splitsTotal / totalMins) * 100, 100) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Race Split Times</h1>
        <p style={styles.subtitle}>Enter your target finish time, then adjust each segment split.</p>

        {/* ── Target Total Input ── */}
        <div style={styles.targetBox}>
          <div style={styles.targetLabel}>
            <span style={styles.targetIcon}>🎯</span>
            <span style={styles.targetText}>Your target finish time</span>
            <span style={styles.targetEvent}>({form.eventName})</span>
          </div>
          <div style={styles.timeInputRow}>
            <div style={styles.timeField}>
              <input
                type="number"
                min={0} max={23}
                value={targetH}
                onChange={e => setTargetH(parseInt(e.target.value) || 0)}
                style={styles.timeInput}
              />
              <span style={styles.timeUnit}>h</span>
            </div>
            <span style={styles.timeSep}>:</span>
            <div style={styles.timeField}>
              <input
                type="number"
                min={0} max={59}
                value={targetM}
                onChange={e => setTargetM(Math.min(59, parseInt(e.target.value) || 0))}
                style={styles.timeInput}
              />
              <span style={styles.timeUnit}>min</span>
            </div>
            <div style={styles.totalDisplay}>{fmtMins(totalMins)} total</div>
          </div>
        </div>

        {/* ── Segment Sliders ── */}
        <div style={styles.segmentList}>
          {SEGMENTS.map(seg => (
            <div key={seg.key} style={styles.segmentRow}>
              <div style={styles.segHeader}>
                <span style={styles.segIcon}>{seg.icon}</span>
                <span style={styles.segLabel}>{seg.label}</span>
                <span style={{ ...styles.segTime, color: seg.color }}>
                  {fmtMins(splits[seg.key] ?? 0)}
                </span>
              </div>
              <input
                type="range"
                min={seg.min} max={seg.max} step={seg.step}
                value={splits[seg.key] ?? seg.min}
                onChange={e => setSplit(seg.key, e.target.value)}
                style={{ ...styles.sliderTrack, '--thumb-color': seg.color }}
                className="split-slider"
                data-color={seg.color}
              />
              <div style={styles.sliderRange}>
                <span>{fmtMins(seg.min)}</span>
                <span>{fmtMins(seg.max)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Total vs Target ── */}
        <div style={{ ...styles.totalBox, borderColor: statusColor + '40' }}>
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Splits total</span>
            <span style={{ ...styles.totalVal, color: statusColor }}>{fmtMins(splitsTotal)}</span>
          </div>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressBar, width: `${pct}%`, background: statusColor }} />
          </div>
          <p style={{ ...styles.statusMsg, color: statusColor }}>{statusMsg}</p>
        </div>

        {/* ── Visual breakdown ── */}
        <div style={styles.breakdown}>
          {SEGMENTS.map(seg => {
            const segPct = splitsTotal > 0 ? Math.round((splits[seg.key] / splitsTotal) * 100) : 0;
            return (
              <div key={seg.key} style={styles.breakdownItem}>
                <div style={{ ...styles.breakdownBar, background: seg.color, height: `${Math.max(segPct, 3)}%` }} />
                <span style={styles.breakdownPct}>{segPct}%</span>
                <span style={styles.breakdownKey}>{seg.label.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        <div style={styles.navRow}>
          <button style={styles.backBtn} onClick={back}>← Back</button>
          <button style={styles.nextBtn} onClick={next}>Continue →</button>
        </div>
      </div>

      <style>{`
        .split-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
        }
        .split-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.18);
          transition: box-shadow 0.2s;
        }
        .split-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 2px 12px rgba(249,115,22,0.4);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: { maxWidth: 720, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 8, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, marginBottom: 28 },

  // Target box
  targetBox: { background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '18px 20px', marginBottom: 28 },
  targetLabel: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 },
  targetIcon: { fontSize: 18 },
  targetText: { fontWeight: 700, fontSize: 15, color: '#0f172a' },
  targetEvent: { fontSize: 13, color: '#94a3b8', marginLeft: 4 },
  timeInputRow: { display: 'flex', alignItems: 'center', gap: 10 },
  timeField: { display: 'flex', alignItems: 'center', gap: 6 },
  timeInput: {
    width: 70, padding: '8px 12px', fontSize: 22, fontWeight: 800,
    color: '#f97316', background: '#fff', border: '2px solid #fed7aa',
    borderRadius: 8, outline: 'none', textAlign: 'center',
  },
  timeUnit: { fontSize: 14, color: '#94a3b8', fontWeight: 600 },
  timeSep: { fontSize: 24, fontWeight: 800, color: '#cbd5e1', marginBottom: 4 },
  totalDisplay: { marginLeft: 12, fontSize: 14, fontWeight: 700, color: '#f97316', background: '#fff', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 14px' },

  // Segments
  segmentList: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
  segmentRow: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' },
  segHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  segIcon: { fontSize: 20 },
  segLabel: { flex: 1, color: '#1e293b', fontWeight: 600, fontSize: 15 },
  segTime: { fontWeight: 800, fontSize: 18, minWidth: 60, textAlign: 'right' },
  sliderTrack: { width: '100%', marginBottom: 4 },
  sliderRange: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' },

  // Total
  totalBox: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '16px', marginBottom: 20 },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { color: '#64748b', fontWeight: 600, fontSize: 14 },
  totalVal: { fontWeight: 800, fontSize: 22 },
  progressBg: { background: '#e2e8f0', borderRadius: 4, height: 7, marginBottom: 10, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s' },
  statusMsg: { fontSize: 13, fontWeight: 600, margin: 0 },

  // Bar chart
  breakdown: { display: 'flex', gap: 8, alignItems: 'flex-end', height: 72, marginBottom: 28, padding: '0 4px' },
  breakdownItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  breakdownBar: { width: '100%', borderRadius: '3px 3px 0 0', minHeight: 4, transition: 'height 0.3s', opacity: 0.85 },
  breakdownPct: { fontSize: 11, fontWeight: 700, color: '#1e293b' },
  breakdownKey: { fontSize: 10, color: '#94a3b8' },

  // Nav
  navRow: { display: 'flex', justifyContent: 'space-between', gap: 12 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  nextBtn: { background: '#f97316', border: 'none', borderRadius: 8, padding: '12px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 8px rgba(249,115,22,0.3)' },
};
