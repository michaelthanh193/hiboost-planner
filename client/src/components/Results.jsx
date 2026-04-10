import { useState, useRef } from 'react';
import { useLang } from '../LangContext';
import html2canvas from 'html2canvas';

export default function Results({ plan, form, restart }) {
  const { t } = useLang();
  const [downloading, setDownloading] = useState(false);
  const stickerRef = useRef(null);

  const downloadCheatSheet = async () => {
    if (!stickerRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(stickerRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `HiBoost-Strategy-${form.lastName || 'Plan'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate sticker image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const { perHour, totals, timeline, products: initialProducts, tips, meta, segmentBreakdown } = plan;
  
  const [cartItems, setCartItems] = useState(initialProducts);
  const updateCart = (index, delta) => {
    const newCart = [...cartItems];
    let newQty = newCart[index].quantity + delta;
    if (newQty < 0) newQty = 0;
    newCart[index].quantity = newQty;
    setCartItems(newCart);
  };

  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const totalPriceVND = cartItems.reduce((sum, p) => sum + (p.priceVND || 0) * p.quantity, 0);

  const submitOrder = async () => {
    setOrdering(true);
    setOrderSuccess(false);

    const orderedItems = cartItems.filter(p => p.quantity > 0);
    const orderLines = orderedItems.map(p => `- ${p.quantity}x ${p.name} (${((p.priceVND || 0) * p.quantity).toLocaleString()} VND)`).join('\n');
    const orderText = orderedItems.length > 0 
      ? `Danh sách sản phẩm:\n${orderLines}\n=> Tổng tiền: ${totalPriceVND.toLocaleString()} VND`
      : 'Khách hàng không đặt mua sản phẩm nào.';

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          sport: form.sport,
          eventName: form.eventName,
          durationHrs: form.durationHrs,
          orderText
        })
      });
      if (!res.ok) throw new Error('Order failed');
      setOrderSuccess(true);
    } catch (e) {
      alert('Không thể gửi đơn hàng. Vui lòng kiểm tra lại trạng thái mạng.');
      console.error(e);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero Banner */}
      <div className="hero-banner" style={styles.heroBanner}>
        <div style={styles.heroLeft}>
          <p style={styles.heroSubtitle}>{t('results_subtitle')}</p>
          <h1 style={styles.heroTitle}>
            {capitalise(meta.sport)}
            {form.eventName ? ` · ${form.eventName}` : ''}
            {` · ${fmtHrs(meta.durationHrs)}`}
          </h1>
          <p style={styles.heroDetail}>
            {meta.bodyWeightKg}kg · {meta.gender === 'female' ? `♀ ${t('body_female')}` : `♂ ${t('body_male')}`} · {t('body_age')} {meta.age} · {t(`sweat_${meta.sweatLevel}`)} · {t(`temp_${meta.temperature}`)}
          </p>
        </div>
        <button style={styles.restartBtn} onClick={restart}>{t('results_new')}</button>
      </div>

      {/* Physiology note */}
      {meta.physiologyNote && (
        <div style={styles.physioNote}>
          <span style={styles.physioIcon}>🧬</span>
          <span>{meta.physiologyNote}</span>
          {meta.sweatTestUsed && (
            <span style={styles.sweatTestBadge}>
              🧪 {meta.sweatRateMlHr && `${meta.sweatRateMlHr} ml/h`}{meta.sweatSodiumMgL && ` · ${meta.sweatSodiumMgL} mg/L`}
            </span>
          )}
        </div>
      )}

      {/* Sodium Alert */}
      {perHour.sodiumMg > 1000 && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.5,
          display: 'flex', gap: 10, alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <span>
            <strong style={{ display: 'block', marginBottom: 2 }}>{t('results_high_sodium_title')}</strong>
            {t('results_high_sodium_desc')}
          </span>
        </div>
      )}

      {/* Key Numbers */}
      <div className="metrics-row" style={styles.metricsRow}>
        <MetricCard icon="🍬" value={`${perHour.carbsG}g`} label={t('results_carbs_hr')} sub={t('results_carbs_sub')} color="#f97316" />
        <MetricCard icon="🧂" value={`${perHour.sodiumMg}mg`} label={t('results_sodium_hr')} sub={t('results_sodium_sub')} color="#3b82f6" />
        <MetricCard icon="💧" value={`${perHour.fluidMl}ml`} label={t('results_fluid_hr')} sub={t('results_fluid_sub')} color="#06b6d4" />
        <MetricCard icon="🔥" value={`${Math.round(perHour.carbsG * 4)}`} label={t('results_cals_hr')} sub={t('results_cals_sub')} color="#f43f5e" />
      </div>

      <div className="results-grid" style={styles.grid}>
        {/* Left column */}
        <div>
          <div style={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={styles.sectionTitle}>{t('results_timeline')}</h2>
                <p style={styles.sectionDesc}>{t('results_timeline_sub')}</p>
              </div>
              <Pill color="#3b82f6">{t('results_pacing_strategy')}</Pill>
            </div>

            <div style={styles.timelineList}>
              {timeline.map((s, i) => (
                <div key={i} style={styles.timelineItem}>
                  <div style={styles.timeLineCol}>
                    <div style={styles.timeLabel}>{s.fromMins === 0 ? "Start" : `${s.fromMins}'`}</div>
                    <div style={styles.lineConnector} />
                  </div>
                  <div style={styles.actionCard}>
                    <div style={styles.actionHeader}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={styles.actionLabel}>{s.label}</span>
                      <span style={styles.actionDuration}>({s.durationMins}')</span>
                    </div>
                    <div style={styles.actionContent}>
                      {s.carbsG > 0 && <span>🍬 {s.carbsG}g Carbs</span>}
                      {s.fluidMl > 0 && <span>💧 {s.fluidMl}ml Fluid</span>}
                      {s.sodiumMg > 0 && <span>🧂 {s.sodiumMg}mg Sodium</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div style={styles.timelineItem}>
                <div style={styles.timeLineCol}>
                   <div style={styles.timeLabel}>{t('results_finish')}</div>
                </div>
                <div style={{ ...styles.actionCard, background: '#f8fafc', border: '1.5px dashed #cbd5e1', boxShadow: 'none' }}>
                   <div style={{ fontWeight: 700, color: '#64748b', fontSize: 13 }}>{t('results_well_done')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticker */}
          {(() => {
            const bikeSection = timeline.find(s => s.segment === 'bike');
            if (!bikeSection) return null;
            return (
              <div ref={stickerRef} style={styles.sectionSticker}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ ...styles.sectionTitle, color: '#2563eb' }}>🚴‍♂️ {t('sticker_title')}</h2>
                    <p style={{ ...styles.sectionDesc, fontSize: 13 }}>{t('sticker_desc')}</p>
                  </div>
                  <button 
                    onClick={downloadCheatSheet} 
                    disabled={downloading}
                    style={{
                      background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, opacity: downloading ? 0.7 : 1
                    }}>
                    {downloading ? '⏳...' : t('sticker_download')}
                  </button>
                </div>
                <div style={styles.stickerContent}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px', background: '#f8fafc', fontSize: 11 }}>{t('sticker_time')}</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px', background: '#f8fafc', fontSize: 11 }}>{t('sticker_nutrition')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bikeSection.planItems.map((pt, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid #94a3b8', padding: '4px', fontSize: 12, textAlign: 'center' }}>
                            {pt.label}
                          </td>
                          <td style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                              {pt.fluidMl > 0 && <img src="/images/products/PF&H_Cartoon%20Product_images/PFH%20500ml%20bottle.png" alt="fluid" style={{ height: '32px' }} />}
                              {pt.carbsG > 0 && <img src="/images/products/PF&H_Cartoon%20Product_images/PF30%20gel.png" alt="carb" style={{ height: '32px' }} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} style={{ background: '#f43f5e', color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', padding: '6px' }}>
                          {(() => {
                             const bikeSeg = segmentBreakdown ? segmentBreakdown.find(s => s.segment === 'bike') : null;
                             return `${t('sticker_finish')} (${bikeSeg ? fmtHrs(bikeSeg.durationMins/60) : fmtHrs(form.durationHrs)})`;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right column */}
        <div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t('results_products')}</h2>
            <p style={styles.sectionDesc}>{t('results_products_sub')}</p>
            {cartItems.length === 0 ? <p>{t('results_no_products')}</p> : (
              <div style={styles.productList}>
                {cartItems.map((p, i) => (
                  <ProductCard key={i} product={p} t={t} onPlus={() => updateCart(i, 1)} onMinus={() => updateCart(i, -1)} />
                ))}
                <div style={{ marginTop: 15, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <span style={{ fontWeight: 700 }}>{t('cart_subtotal')}</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>{totalPriceVND.toLocaleString()} VND</span>
                  </div>
                  <button onClick={submitOrder} disabled={ordering} style={{ width: '100%', background: '#f97316', color: '#fff', padding: '14px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    {ordering ? t('cart_sending') : t('cart_order_btn')}
                  </button>
                  {orderSuccess && <div style={{ color: '#047857', textAlign: 'center', marginTop: 12 }}>{t('cart_success')}</div>}
                </div>
              </div>
            )}
          </div>

          {tips.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>{t('results_tips')}</h2>
              <ul style={styles.tipList}>
                {tips.map((tip, i) => (
                  <li key={i} style={styles.tipItem}>
                    <span style={styles.tipBullet}>-&gt;</span>
                    <span>{t(tip) || tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div style={styles.ctaBanner}>
        <h3 style={styles.ctaTitle}>{t('results_cta_title')}</h3>
        <p style={styles.ctaDesc}>{t('results_cta_desc')}</p>
        <a href="https://www.hiboostnutrition.com/shop" target="_blank" rel="noreferrer" style={styles.ctaBtn}>{t('results_cta_btn')}</a>
      </div>

      <div style={styles.disclaimer}>{t('results_disclaimer')}</div>
    </div>
  );
}

function MetricCard({ icon, value, label, sub, color }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricIcon}>{icon}</span>
      <span style={{ ...styles.metricValue, color }}>{value}</span>
      <span style={styles.metricLabel}>{label}</span>
      <span style={styles.metricSub}>{sub}</span>
    </div>
  );
}

function Pill({ color, children }) {
  return (
    <span style={{ ...styles.pill, background: color + '22', color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

function ProductCard({ product, t, onPlus, onMinus }) {
  const nf = product.nutrition || {};
  return (
    <div style={styles.productCard}>
      <div style={styles.productTop}>
        <div>
          <p style={styles.productName}>{product.name}</p>
          <p style={styles.productType}>{typeLabel(product.type)} {product.brand && <span>· {product.brand}</span>}</p>
        </div>
        <div style={styles.quantityGrid}>
           <button onClick={onMinus} style={styles.qtyBtn}>-</button>
           <span style={styles.qtyVal}>{product.quantity}</span>
           <button onClick={onPlus} style={styles.qtyBtn}>+</button>
        </div>
      </div>
      <p style={styles.productUsage}>📋 {(() => {
        if (!product.usage) return '';
        const [key, param] = product.usage.split(':');
        const translated = t(key);
        if (param && translated) return translated.replace('{interval}', param);
        return translated || product.usage;
      })()}</p>
      <div style={styles.productFooter}>
        <span style={styles.productPrice}>{product.priceVND ? `${(product.priceVND * product.quantity).toLocaleString()} VND` : ''}</span>
        {product.url && <a href={product.url} target="_blank" rel="noreferrer" style={styles.productLink}>View →</a>}
      </div>
    </div>
  );
}

function typeLabel(type) {
  const map = { carb: '🍬 Carb', electrolyte: '🧂 Electrolyte', 'carb+fluid': '🍬💧 Carbs + Fluid', 'electrolyte+fluid': '🧂💧 Salt + Fluid' };
  return map[type] || type;
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ') : '';
}

function fmtHrs(h) {
  const num = parseFloat(h);
  if (!num || num <= 0) return '';
  const hrs = Math.floor(num);
  const mins = Math.round((num - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  return mins === 0 ? `${hrs}h` : `${hrs}h${mins}min`;
}

const styles = {
  container: { maxWidth: 1000, margin: '0 auto', padding: '20px' },
  heroBanner: { background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)', border: '1.5px solid #fed7aa', borderRadius: 16, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  heroLeft: { flex: 1 },
  heroSubtitle: { fontSize: 13, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  heroTitle: { fontSize: 32, fontWeight: 800, color: '#0f172a', margin: 0 },
  heroDetail: { fontSize: 14, color: '#64748b', marginTop: 10 },
  restartBtn: { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, color: '#475569', cursor: 'pointer' },
  physioNote: { background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 10 },
  physioIcon: { fontSize: 18 },
  sweatTestBadge: { marginLeft: 'auto', background: '#fff', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  metricCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 },
  metricIcon: { fontSize: 24, marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: 800 },
  metricLabel: { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  metricSub: { fontSize: 11, color: '#94a3b8' },
  grid: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 28 },
  section: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '28px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  sectionTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  sectionDesc: { fontSize: 14, color: '#64748b', marginTop: 6 },
  pill: { fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  timelineList: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineItem: { display: 'flex', gap: 20 },
  timeLineCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 45 },
  timeLabel: { fontSize: 12, fontWeight: 700, color: '#94a3b8', height: 20, display: 'flex', alignItems: 'center' },
  lineConnector: { width: 2, flex: 1, background: '#e2e8f0', margin: '4px 0' },
  actionCard: { flex: 1, background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px', marginBottom: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  actionHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  actionLabel: { fontWeight: 700, fontSize: 14, color: '#1e293b' },
  actionDuration: { fontSize: 12, color: '#94a3b8' },
  actionContent: { display: 'flex', gap: 12, fontSize: 12, color: '#475569', fontWeight: 500 },
  sectionSticker: { background: '#fff', border: '2px solid #2563eb', borderRadius: 16, padding: '24px', marginBottom: 28 },
  stickerContent: { marginTop: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' },
  productList: { display: 'flex', flexDirection: 'column', gap: 12 },
  productCard: { border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px', background: '#f8fafc' },
  productTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  productName: { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 },
  productType: { fontSize: 11, color: '#64748b', marginTop: 2 },
  quantityGrid: { display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff' },
  qtyBtn: { padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 },
  qtyVal: { width: 30, textAlign: 'center', fontWeight: 700, fontSize: 14 },
  productUsage: { fontSize: 12, color: '#475569', padding: '8px 10px', background: '#fff', borderRadius: 6, margin: '8px 0' },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  productPrice: { fontSize: 13, fontWeight: 800, color: '#16a34a' },
  productLink: { fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none' },
  tipList: { listStyle: 'none', padding: 0, margin: '16px 0 0 0', display: 'flex', flexDirection: 'column', gap: 12 },
  tipBullet: { color: '#f97316', fontWeight: 700 },
  tipItem: { fontSize: 13, color: '#475569', display: 'flex', gap: 10, lineHeight: 1.5 },
  ctaBanner: { background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: 14, padding: '24px 28px', color: '#fff', marginTop: 28 },
  ctaTitle: { margin: 0, fontSize: 20, fontWeight: 800 },
  ctaDesc: { margin: '8px 0 20px 0', fontSize: 14, color: '#fed7aa' },
  ctaBtn: { background: '#fff', color: '#ea580c', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, display: 'inline-block' },
  disclaimer: { fontSize: 11, color: '#94a3b8', marginTop: 24, textAlign: 'center' }
};
