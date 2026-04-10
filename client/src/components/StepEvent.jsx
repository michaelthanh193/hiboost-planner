import { useState } from 'react';
import { useLang } from '../LangContext';

// ─── SPORT-SPECIFIC EVENT CATALOG ────────────────────────────────────────────
// Each event has 3 tiers: Beginner, Intermediate, Advanced finish times

const EVENT_CATALOG = {
  running: {
    label: 'Running',
    icon: '🏃',
    groups: [
      {
        groupLabel: 'Road Races',
        events: [
          { id: '5k',            label: '5K',                   dist: '5 km',      tiers: { beginner: 0.55, intermediate: 0.42, advanced: 0.28 } },
          { id: '10k',           label: '10K',                  dist: '10 km',     tiers: { beginner: 1.08, intermediate: 0.83, advanced: 0.58 } },
          { id: 'half_marathon', label: 'Half Marathon',         dist: '21.1 km',   tiers: { beginner: 2.75, intermediate: 2.00, advanced: 1.33 } },
          { id: 'marathon',      label: 'Marathon',              dist: '42.2 km',   tiers: { beginner: 5.50, intermediate: 4.00, advanced: 2.75 } },
        ],
      },
      {
        groupLabel: 'Ultra Running',
        events: [
          { id: 'ultra_50k',     label: 'Ultra 50K',            dist: '50 km',     tiers: { beginner: 8.00, intermediate: 6.00, advanced: 3.75 } },
          { id: 'ultra_100k',    label: 'Ultra 100K',           dist: '100 km',    tiers: { beginner: 18.0, intermediate: 13.0, advanced: 8.50 } },
          { id: 'ultra_100mi',   label: 'Ultra 100 Miles',      dist: '160 km',    tiers: { beginner: 32.0, intermediate: 24.0, advanced: 17.0 } },
        ],
      },
      {
        groupLabel: 'Trail Running',
        events: [
          { id: 'trail_21k',     label: 'Trail 21K',            dist: '21 km',     tiers: { beginner: 4.00, intermediate: 2.75, advanced: 1.83 } },
          { id: 'trail_50k',     label: 'Trail 50K',            dist: '50 km',     tiers: { beginner: 12.0, intermediate: 8.00, advanced: 5.25 } },
          { id: 'trail_100k',    label: 'Trail 100K',           dist: '100 km',    tiers: { beginner: 28.0, intermediate: 18.0, advanced: 12.0 } },
        ],
      },
    ],
  },

  triathlon: {
    label: 'Triathlon',
    icon: '🏊🚴🏃',
    groups: [
      {
        groupLabel: 'Standard Formats',
        events: [
          { id: 'super_sprint',  label: 'Super Sprint',         dist: '400m / 10km / 2.5km',    tiers: { beginner: 0.92, intermediate: 0.72, advanced: 0.55 } },
          { id: 'sprint',        label: 'Sprint Triathlon',     dist: '750m / 20km / 5km',      tiers: { beginner: 1.42, intermediate: 1.17, advanced: 0.83 } },
          { id: 'olympic',       label: 'Olympic / Standard',   dist: '1.5km / 40km / 10km',    tiers: { beginner: 2.83, intermediate: 2.25, advanced: 1.75 } },
          { id: 'half_ironman',  label: 'Ironman 70.3',         dist: '1.9km / 90km / 21km',    tiers: { beginner: 7.50, intermediate: 5.50, advanced: 3.75 } },
          { id: 'ironman',       label: 'Ironman 140.6',        dist: '3.8km / 180km / 42km',   tiers: { beginner: 15.0, intermediate: 11.5, advanced: 8.25 } },
        ],
      },
      {
        groupLabel: 'Long Course',
        events: [
          { id: 'challenge_tri', label: 'Long Course (226km)',   dist: '3.8km / 180km / 42km',   tiers: { beginner: 16.0, intermediate: 12.0, advanced: 9.00 } },
          { id: 'ultra_tri',     label: 'Double / Ultra Tri',   dist: '7.6km+ / 360km+ / 84km+', tiers: { beginner: 34.0, intermediate: 26.0, advanced: 19.0 } },
        ],
      },
    ],
  },

  cycling: {
    label: 'Cycling',
    icon: '🚴',
    groups: [
      {
        groupLabel: 'Gran Fondo / Road',
        events: [
          { id: 'cycling_50k',   label: 'Sportive 50km',        dist: '50 km',     tiers: { beginner: 2.25, intermediate: 1.67, advanced: 1.25 } },
          { id: 'cycling_100k',  label: 'Gran Fondo 100km',     dist: '100 km',    tiers: { beginner: 4.25, intermediate: 3.00, advanced: 2.50 } },
          { id: 'cycling_160k',  label: 'Gran Fondo 160km',     dist: '160 km',    tiers: { beginner: 6.50, intermediate: 5.00, advanced: 4.00 } },
          { id: 'cycling_200k',  label: 'Gran Fondo 200km',     dist: '200 km',    tiers: { beginner: 8.50, intermediate: 6.50, advanced: 5.50 } },
        ],
      },
      {
        groupLabel: 'Race Formats',
        events: [
          { id: 'time_trial',    label: 'Time Trial',           dist: '20–40 km',  tiers: { beginner: 1.25, intermediate: 0.92, advanced: 0.55 } },
          { id: 'criterium',     label: 'Criterium / Circuit',  dist: '30–60 km',  tiers: { beginner: 1.75, intermediate: 1.25, advanced: 0.83 } },
          { id: 'stage_race',    label: 'Stage Race (per day)', dist: '100–200 km/day', tiers: { beginner: 6.50, intermediate: 4.50, advanced: 3.25 } },
        ],
      },
      {
        groupLabel: 'Ultra Cycling',
        events: [
          { id: 'cycling_300k',  label: 'Ultra 300km+',         dist: '300+ km',   tiers: { beginner: 16.0, intermediate: 12.0, advanced: 9.50 } },
        ],
      },
    ],
  },

  swimming: {
    label: 'Open Water Swimming',
    icon: '🏊',
    groups: [
      {
        groupLabel: 'Open Water',
        events: [
          { id: 'swim_750m',     label: '750m Open Water',      dist: '750 m',     tiers: { beginner: 0.40, intermediate: 0.28, advanced: 0.20 } },
          { id: 'swim_1500m',    label: '1.5km Open Water',     dist: '1.5 km',    tiers: { beginner: 0.75, intermediate: 0.55, advanced: 0.38 } },
          { id: 'swim_3k',       label: '3km Open Water',       dist: '3 km',      tiers: { beginner: 1.33, intermediate: 1.00, advanced: 0.75 } },
          { id: 'swim_5k',       label: '5km Open Water',       dist: '5 km',      tiers: { beginner: 2.17, intermediate: 1.67, advanced: 1.25 } },
          { id: 'swim_10k',      label: '10km Open Water',      dist: '10 km',     tiers: { beginner: 3.75, intermediate: 3.00, advanced: 2.33 } },
          { id: 'marathon_swim', label: 'Marathon Swim (25km)', dist: '25 km',     tiers: { beginner: 10.0, intermediate: 7.50, advanced: 5.50 } },
        ],
      },
    ],
  },

  other: {
    label: 'Other Sports',
    icon: '⚡',
    groups: [
      {
        groupLabel: 'General Endurance',
        events: [
          { id: 'other_1h',      label: '~1 Hour Effort',       dist: '',          tiers: { beginner: 1.25, intermediate: 1.00, advanced: 0.75 } },
          { id: 'other_2h',      label: '~2 Hour Effort',       dist: '',          tiers: { beginner: 2.25, intermediate: 2.00, advanced: 1.75 } },
          { id: 'other_3h',      label: '~3 Hour Effort',       dist: '',          tiers: { beginner: 3.50, intermediate: 3.00, advanced: 2.50 } },
          { id: 'other_5h',      label: '~5 Hour Effort',       dist: '',          tiers: { beginner: 5.50, intermediate: 5.00, advanced: 4.50 } },
        ],
      },
    ],
  },
};

const TIER_META = [
  { key: 'beginner',     label: 'Beginner',     icon: '🟢', color: '#16a34a', desc: 'Comfortable pace, finish strong' },
  { key: 'intermediate', label: 'Intermediate',  icon: '🔵', color: '#2563eb', desc: 'Solid pacer, trained athlete' },
  { key: 'advanced',     label: 'Advanced',      icon: '🟠', color: '#ea580c', desc: 'Competitive, racing to perform' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtHrs(h) {
  if (!h || h <= 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}min`;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function StepEvent({ form, update, next, back }) {
  const { t } = useLang();
  const [showCustom, setShowCustom] = useState(false);

  const sportKey = form.sport || 'running';
  const catalog  = EVENT_CATALOG[sportKey] || EVENT_CATALOG.running;

  // The currently selected event object (from catalog)
  const selectedEvt = form._eventMeta || null;
  // The selected tier key
  const selectedTier = form._selectedTier || null;

  const selectEvent = (evt) => {
    update({
      eventName:  evt.label,
      distanceKm: parseFloat(evt.dist) || '',
      _eventMeta: evt,
      _selectedTier: null,
      durationHrs: '',   // reset until tier chosen
    });
    setShowCustom(false);
  };

  const selectTier = (tierKey) => {
    if (!selectedEvt) return;
    const hrs = selectedEvt.tiers[tierKey];
    update({ _selectedTier: tierKey, durationHrs: hrs });
  };

  const canContinue = form.durationHrs && parseFloat(form.durationHrs) > 0;

  // Slider min/max: beginner is slowest (highest hrs), advanced is fastest
  const sliderMin = selectedEvt ? selectedEvt.tiers.advanced : 0;
  const sliderMax = selectedEvt ? selectedEvt.tiers.beginner : 1;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Title + sport badge */}
        <div style={styles.titleRow}>
          <div>
            <h1 style={styles.title}>{t('event_title')}</h1>
            <p style={styles.subtitle}>
              {t('event_subtitle')}
            </p>
          </div>
          <div style={styles.sportBadge}>
            <span style={styles.sportBadgeIcon}>{catalog.icon}</span>
            <span style={styles.sportBadgeLabel}>{catalog.label}</span>
          </div>
        </div>

        {/* Event groups */}
        {!showCustom && catalog.groups.map((group) => (
          <div key={group.groupLabel} style={styles.group}>
            <div style={styles.groupLabel}>{t('event_group_' + group.groupLabel.toLowerCase().replace(/[^a-z]+/g, '_').replace(/_$/, '')) || group.groupLabel}</div>
            <div style={styles.eventGrid}>
              {group.events.map(evt => {
                const selected = form.eventName === evt.label;
                return (
                  <button
                    key={evt.id}
                    onClick={() => selectEvent(evt)}
                    style={{ ...styles.eventBtn, ...(selected ? styles.eventActive : {}) }}
                  >
                    <div style={styles.eventName}>
                      {evt.label}
                      <span style={{
                        marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: evt.id.includes('advanced') ? '#ea580c' : '#e2e8f0', color: '#475569'
                      }}>
                         {evt.tiers && Object.keys(evt.tiers).length ? "All Levels" : "Pro"}
                      </span>
                    </div>
                    {evt.dist && <div style={styles.eventDist}>{evt.dist}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Tier selector — shown after picking an event ── */}
        {!showCustom && selectedEvt && (
          <div style={styles.tierSection}>
            <div style={styles.tierTitle}>
              {t('event_level_for')} <strong>{selectedEvt.label}</strong>?
            </div>
            <div style={styles.tierGrid}>
              {TIER_META.map(tier => {
                const hrs = selectedEvt.tiers[tier.key];
                const active = selectedTier === tier.key;
                return (
                  <button
                    key={tier.key}
                    onClick={() => selectTier(tier.key)}
                    style={{
                      ...styles.tierBtn,
                      borderColor: active ? tier.color : '#e2e8f0',
                      background: active ? tier.color + '0d' : '#f8fafc',
                    }}
                  >
                    <span style={styles.tierIcon}>{tier.icon}</span>
                    <span style={{ ...styles.tierLabel, color: active ? tier.color : '#1e293b' }}>{t(`tier_${tier.key}`)}</span>
                    <span style={styles.tierDesc}>{t(`tier_${tier.key}_desc`)}</span>
                    <span style={{ ...styles.tierTime, color: tier.color }}>{fmtHrs(hrs)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Fine-tune slider ── */}
        {!showCustom && selectedEvt && selectedTier && (
          <div style={styles.timeAdjust}>
            <div style={styles.timeAdjustTitle}>
              {t('event_finetune')}
            </div>
            <p style={styles.timeAdjustSub}>
              {t('event_finetune_sub')} {fmtHrs(sliderMin)} – {fmtHrs(sliderMax)}.
            </p>
            <div style={styles.sliderRow}>
              <span style={styles.sliderEdge}>{fmtHrs(sliderMin)}</span>
              <input
                type="range"
                min={Math.round(sliderMin * 60)}
                max={Math.round(sliderMax * 60)}
                step={1}
                value={Math.round(parseFloat(form.durationHrs || sliderMin) * 60)}
                onChange={e => {
                  const mins = parseInt(e.target.value);
                  update({ durationHrs: mins / 60 });
                }}
                style={styles.slider}
              />
              <span style={styles.sliderEdge}>{fmtHrs(sliderMax)}</span>
            </div>
            <div style={styles.sliderValue}>
              {fmtHrs(parseFloat(form.durationHrs))}
            </div>
          </div>
        )}

        {/* Custom event form */}
        {showCustom && (
          <div style={styles.customBox}>
            <div style={styles.customTitle}>{t('event_custom_title')}</div>
            <div className="custom-fields" style={styles.customFields}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('event_custom_name')} <span style={styles.optional}>{t('event_custom_optional')}</span></label>
                <input
                  style={styles.input}
                  placeholder="e.g. Mekong Delta Ultra"
                  value={form.eventName || ''}
                  onChange={e => update({ eventName: e.target.value })}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('event_custom_duration')} <span style={styles.unit}>{t('event_custom_hours')}</span></label>
                <input
                  style={styles.input}
                  type="number" min="0.25" max="36" step="0.25"
                  placeholder="e.g. 4.5"
                  value={form.durationHrs || ''}
                  onChange={e => update({ durationHrs: e.target.value })}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('event_custom_distance')} <span style={styles.unit}>{t('event_custom_km')}</span></label>
                <input
                  style={styles.input}
                  type="number" min="1" max="1000"
                  placeholder="e.g. 75"
                  value={form.distanceKm || ''}
                  onChange={e => update({ distanceKm: e.target.value })}
                />
              </div>
            </div>
            <button style={styles.switchBtn} onClick={() => setShowCustom(false)}>{t('event_custom_back')}</button>
          </div>
        )}

        {/* Custom link */}
        {!showCustom && (
          <div style={styles.customLink}>
            {t('event_cant_find')}{' '}
            <button style={styles.customLinkBtn} onClick={() => { setShowCustom(true); update({ _eventMeta: null, _selectedTier: null }); }}>
              {t('event_custom_link')}
            </button>
          </div>
        )}

        {/* Nav */}
        <div style={styles.navRow}>
          <button style={styles.backBtn} onClick={back}>{t('back')}</button>
          <button
            style={{ ...styles.nextBtn, opacity: canContinue ? 1 : 0.4 }}
            onClick={next}
            disabled={!canContinue}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = {
  container: { maxWidth: 780, margin: '0 auto' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },

  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 },
  title:    { fontSize: 28, fontWeight: 800, marginBottom: 6, color: '#0f172a' },
  subtitle: { color: '#64748b', fontSize: 15, lineHeight: 1.5 },
  sportBadge:      { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '10px 16px' },
  sportBadgeIcon:  { fontSize: 22 },
  sportBadgeLabel: { fontSize: 11, fontWeight: 700, color: '#c2410c', whiteSpace: 'nowrap' },

  group:      { marginBottom: 22 },
  groupLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  eventGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 },

  eventBtn: {
    background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12,
    padding: '14px 12px', cursor: 'pointer', textAlign: 'left',
    display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.18s',
  },
  eventActive: { border: '2px solid #f97316', background: '#fff7ed', boxShadow: '0 2px 12px rgba(249,115,22,0.15)' },
  eventName:  { fontSize: 14, fontWeight: 700, color: '#1e293b', lineHeight: 1.3 },
  eventDist:  { fontSize: 11, color: '#64748b', fontWeight: 500 },
  eventTimeRange: { fontSize: 11, color: '#94a3b8' },

  // Tier selector
  tierSection: { background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '20px', marginBottom: 20, marginTop: 4 },
  tierTitle:   { fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 14 },
  tierGrid:    { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  tierBtn: {
    border: '2px solid #e2e8f0', borderRadius: 10, padding: '14px 12px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 5, textAlign: 'center', transition: 'all 0.18s',
  },
  tierIcon:  { fontSize: 18 },
  tierLabel: { fontSize: 14, fontWeight: 700 },
  tierDesc:  { fontSize: 11, color: '#94a3b8', lineHeight: 1.3 },
  tierTime:  { fontSize: 18, fontWeight: 800, marginTop: 2 },

  // Time fine-tune
  timeAdjust:      { background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '18px 20px', marginBottom: 20 },
  timeAdjustTitle: { fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 },
  timeAdjustSub:   { fontSize: 12, color: '#64748b', marginBottom: 14, marginTop: 0 },
  sliderRow:       { display: 'flex', alignItems: 'center', gap: 10 },
  sliderEdge:      { fontSize: 12, color: '#94a3b8', minWidth: 50, textAlign: 'center' },
  slider:          { flex: 1, accentColor: '#f97316', cursor: 'pointer' },
  sliderValue:     { marginTop: 10, fontSize: 26, fontWeight: 800, color: '#f97316', textAlign: 'center' },

  // Custom
  customBox:     { background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: '20px 22px', marginBottom: 20 },
  customTitle:   { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 },
  customFields:  { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 14 },
  fieldGroup:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:         { fontSize: 13, fontWeight: 600, color: '#374151' },
  optional:      { fontSize: 11, color: '#94a3b8', fontWeight: 400 },
  unit:          { fontSize: 11, color: '#94a3b8', fontWeight: 400 },
  input:         { background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '11px 13px', color: '#0f172a', fontSize: 15, outline: 'none' },
  switchBtn:     { background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 600 },

  customLink:    { textAlign: 'center', fontSize: 13, color: '#94a3b8', marginBottom: 20 },
  customLinkBtn: { background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 },

  navRow:  { display: 'flex', justifyContent: 'space-between', gap: 12 },
  backBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '12px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600 },
  nextBtn: { background: '#f97316', border: 'none', borderRadius: 8, padding: '12px 28px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 15, flex: 1, boxShadow: '0 2px 8px rgba(249,115,22,0.3)', transition: 'opacity 0.2s' },
};
