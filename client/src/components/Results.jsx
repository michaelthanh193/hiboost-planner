import { useState, useRef, useEffect } from 'react';
import { useLang } from '../LangContext';
import { toPng } from 'html-to-image';

function fmtHrs(h) {
  if (!h || h <= 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${mins}min`;
  return mins === 0 ? `${hrs}h` : `${hrs}h${mins}min`;
}

export default function Results({ plan, form, restart }) {
  const { t } = useLang();
  const cheatSheetRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadCheatSheet = async () => {
    if (!cheatSheetRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cheatSheetRef.current, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `HiBoost_CheatSheet_${form.eventName || 'Race'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate cheat sheet', err);
    } finally {
      setDownloading(false);
    }
  };

  const { perHour, totals, timeline, products: initialProducts, tips, sweatRatePerHr, meta, segmentBreakdown } = plan;
  
  // Phase 4: E-commerce tracking & Shopping Cart
  const [cartItems, setCartItems] = useState(initialProducts);
  useEffect(() => {
    setCartItems(initialProducts);
  }, [initialProducts]);

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
          orderText: orderText
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

      {/* Task 2.2: Sodium Alert for Extreme Sodum Loss */}
      {perHour.sodiumMg > 1000 && (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.5,
          display: 'flex', gap: 10, alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <span>
            <strong style={{ display: 'block', marginBottom: 2 }}>{t('results_high_sodium_title') || 'Cảnh Báo Lượng Muối:'}</strong>
            {t('results_high_sodium_desc') || 'Lượng sụt giảm Sodium dự đoán ban đầu của bạn rất cao (>1500mg/h). Việc uống một lượng nước quá mặn liên tục trong nhiều giờ có thể gây rối loạn tiêu hoá. Hãy chủ động train dạ dày trong các phần tập dài, hoặc kết hợp dùng nước uống điện giải cùng muối viên (Salt caps) để cân bằng vị giác.'}
          </span>
        </div>
      )}

      {/* Key Numbers */}
      <div className="metrics-row" style={styles.metricsRow}>
        <MetricCard
          icon="🍬"
          value={`${perHour.carbsG}g`}
          label={t('results_carbs_hr')}
          sub={`${totals.carbsG}g ${t('results_total')}`}
          color="#f97316"
        />
        <MetricCard
          icon="🧂"
          value={`${perHour.sodiumMg}mg`}
          label={t('results_sodium_hr')}
          sub={`${totals.sodiumMg}mg ${t('results_total')}`}
          color="#3b82f6"
        />
        <MetricCard
          icon="💧"
          value={`${perHour.fluidMl}ml`}
          label={t('results_fluid_hr')}
          sub={`${totals.fluidMl}ml ${t('results_total')}`}
          color="#22c55e"
        />
        <MetricCard
          icon="🌊"
          value={`${sweatRatePerHr}ml`}
          label={t('results_sweat_hr')}
          sub={meta.sweatTestUsed && meta.sweatRateMlHr ? t('results_from_test') : t('results_estimated')}
          color="#a855f7"
        />
      </div>

      {/* Triathlon Segment Breakdown */}
      {segmentBreakdown && segmentBreakdown.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('results_segment')}</h2>
          <p style={styles.sectionDesc}>{t('results_segment_sub')}</p>
          <div className="seg-grid" style={styles.segGrid}>
            {segmentBreakdown.map((seg, i) => (
              <div key={i} style={styles.segCard}>
                <div style={styles.segTop}>
                  <span style={styles.segIcon}>{seg.icon}</span>
                  <div>
                    <div style={styles.segName}>{seg.label}</div>
                    <div style={styles.segDur}>
                      {seg.durationMins >= 60
                        ? `${Math.floor(seg.durationMins / 60)}h ${seg.durationMins % 60 > 0 ? (seg.durationMins % 60) + 'min' : ''}`
                        : `${seg.durationMins} min`}
                    </div>
                  </div>
                </div>
                <div style={styles.segNums}>
                  {seg.carbsG > 0   && <Pill color="#f97316">{seg.carbsG}g {t('nf_carbs')}</Pill>}
                  {seg.fluidMl > 0  && <Pill color="#22c55e">{seg.fluidMl}ml fluid</Pill>}
                  {seg.sodiumMg > 0 && <Pill color="#3b82f6">{seg.sodiumMg}mg {t('nf_sodium')}</Pill>}
                  {seg.carbsG === 0 && seg.fluidMl === 0 && <Pill color="#6b7280">{t('results_no_fuel')}</Pill>}
                </div>
                {seg.note && <p style={styles.segNote}>{seg.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="two-col" style={styles.twoCol}>
        {/* Segmented Timeline */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('results_timeline')}</h2>
          <p style={styles.sectionDesc}>{t('results_timeline_sub')}</p>
          <div style={styles.timeline}>
            {timeline.map((section, si) => (
              <div key={si} style={styles.timelineSection}>
                {/* Section header */}
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionHeaderIcon}>{section.icon}</span>
                  <span style={styles.sectionHeaderLabel}>{section.label}</span>
                </div>
                {/* Items */}
                {section.items.map((point, i) => (
                  <div key={i} style={{
                    ...styles.timelineRow,
                    ...(i === section.items.length - 1 ? { borderLeftColor: 'transparent' } : {}),
                  }}>
                    <div style={{
                      ...styles.timelineDot,
                      background: section.segment === 'pre-race' ? '#94a3b8'
                        : section.segment === 'swim' ? '#3b82f6'
                        : section.segment === 'bike' ? '#f97316'
                        : section.segment === 'run'  ? '#16a34a'
                        : section.segment === 't1' || section.segment === 't2' ? '#8b5cf6'
                        : '#f97316',
                    }} />
                    <div style={styles.timelineContent}>
                      <div style={styles.timelineHeader}>
                        <span style={styles.timelineTime}>{point.label}</span>
                        {point.note && <span style={styles.timelineNote}>{point.note}</span>}
                      </div>
                      <div style={styles.timelineNums}>
                        {point.carbsG > 0   && <Pill color="#f97316">{point.carbsG}g {t('nf_carbs')}</Pill>}
                        {point.fluidMl > 0  && <Pill color="#22c55e">{point.fluidMl}ml fluid</Pill>}
                        {point.sodiumMg > 0 && <Pill color="#3b82f6">{point.sodiumMg}mg {t('nf_sodium')}</Pill>}
                        {point.carbsG === 0 && point.fluidMl === 0 && point.sodiumMg === 0 &&
                          <Pill color="#94a3b8">{t('results_no_fuel')}</Pill>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Phase 3: Strategy Sticker Download Section */}
{(() => {
          const bikeSection = timeline.find(s => s.segment === 'bike');
          if (!bikeSection) return null; // Strategy Sticker only for Bike section!

          return (
            <div style={{ ...styles.section, marginTop: 30 }}>
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
                    display: 'flex', alignItems: 'center', gap: 6, transition: '0.2s',
                    opacity: downloading ? 0.7 : 1
                  }}>
                  {downloading ? '⏳...' : t('sticker_download')}
                </button>
              </div>
              
              {/* Render Area for HTML to Image */}
              <div style={{ padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                <div ref={cheatSheetRef} style={{
                  width: '180px', background: '#fff', border: '1px solid #e2e8f0',
                  padding: '4px', margin: '0 auto', fontFamily: 'Arial, sans-serif',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}>
                  {/* Top Header */}
                  <div style={{ color: '#9f1239', fontSize: 12, fontWeight: 'bold', padding: '2px 4px 6px 4px', textTransform: 'uppercase' }}>
                    {form.firstName ? `${form.lastName} ${form.firstName}` : 'RACE STRATEGY'}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #94a3b8', padding: '4px', fontSize: 10, color: '#475569', textAlign: 'center', width: '35%' }}>{t('sticker_time')}</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '4px', fontSize: 10, color: '#475569', textAlign: 'center', width: '65%' }}>{t('sticker_nutrition')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bikeSection.items.map((pt, i) => {
                        if (pt.carbsG === 0 && pt.fluidMl === 0) return null;
                        if (pt.label.includes('End') || pt.label.includes('Finish')) return null;

                        // Time parsing for clean format
                        let timeStr = pt.label.replace(/\+/g, '').replace(/min/g, '').trim();
                        if (pt.label.includes('Start')) timeStr = '0';
                        
                        let timeNum = parseInt(timeStr);
                        let displayTime = pt.label;
                        if (!isNaN(timeNum)) {
                          if (timeNum === 0) displayTime = `0'`;
                          else if (timeNum % 60 === 0) displayTime = `${timeNum/60}h`;
                          else if (timeNum > 60) displayTime = `${Math.floor(timeNum/60)}h${timeNum%60}`;
                          else displayTime = `${timeNum}'`;
                        }

                        const isFluid = pt.fluidMl > 0;
                        const isCarb = pt.carbsG > 0;

                        return (
                          <tr key={i}>
                            <td style={{ border: '1px solid #94a3b8', padding: '4px', fontSize: 12, color: '#881337', textAlign: 'center' }}>
                              {displayTime}
                            </td>
                            <td style={{ border: '1px solid #94a3b8', padding: '4px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, minHeight: '32px' }}>
                                {isFluid && (
                                  <img 
                                    src="/images/products/PF&H_Cartoon%20Product_images/PFH%20500ml%20bottle.png" 
                                    alt="fluid" 
                                    style={{ height: '32px' }} 
                                  />
                                )}
                                {isCarb && (
                                  <img 
                                    src="/images/products/PF&H_Cartoon%20Product_images/PF30%20gel.png" 
                                    alt="carb" 
                                    style={{ height: '32px', borderRadius: 4 }} 
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={2} style={{ background: '#f43f5e', color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', padding: '6px' }}>
                          {(() => {
                            const bikeSeg = segmentBreakdown && segmentBreakdown.find ? segmentBreakdown.find(s => s.segment === 'bike') : null;
                            const finishStr = bikeSeg 
                              ? `${Math.floor(bikeSeg.durationMins / 60)}h${bikeSeg.durationMins % 60 > 0 ? (bikeSeg.durationMins % 60) + 'min' : ''}`
                              : fmtHrs(form.durationHrs);
                            return `${t('sticker_finish')} (${finishStr})`;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Right column */}
        <div>
          {/* Product Recommendations */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>{t('results_products')}</h2>
            <p style={styles.sectionDesc}>{t('results_products_sub')}</p>
            {cartItems.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: 14 }}>{t('results_no_products')}</p>
            ) : (
              <div style={styles.productList}>
                {cartItems.map((p, i) => (
                  <ProductCard 
                    key={i} 
                    product={p} 
                    t={t} 
                    onPlus={() => updateCart(i, 1)}
                    onMinus={() => updateCart(i, -1)}
                  />
                ))}

                {/* Calculate Total Order */}
                <div style={{ marginTop: 15, borderTop: '2px solid #e2e8f0', paddingTop: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{t('cart_subtotal')}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{totalPriceVND.toLocaleString()} VND</span>
                  </div>
                  <button 
                    onClick={submitOrder}
                    disabled={ordering || cartItems.every(p => p.quantity === 0)}
                    style={{
                      width: '100%', background: (ordering || cartItems.every(p => p.quantity === 0)) ? '#94a3b8' : '#f97316', color: '#fff', 
                      padding: '14px', borderRadius: 8, fontSize: 15, fontWeight: 700, border: 'none', 
                      cursor: (ordering || cartItems.every(p => p.quantity === 0)) ? 'not-allowed' : 'pointer',
                      transition: '0.2s',
                    }}>
                    {ordering ? t('cart_sending') : t('cart_order_btn')}
                  </button>
                  {orderSuccess && (
                     <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '10px', borderRadius: 6, marginTop: 12 }}>
                       <p style={{ color: '#047857', textAlign: 'center', margin: 0, fontWeight: 600, fontSize: 13 }}>
                         {t('cart_success')}
                       </p>
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* Science Tips */}
          {tips.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>{t('results_tips')}</h2>
              <ul style={styles.tipList}>
                {tips.map((tip, i) => (
                  <li key={i} style={styles.tipItem}>
                    <span style={styles.tipBullet}>&rarr;</span>
                    <span>{t(tip) || tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="cta-banner" style={styles.ctaBanner}>
        <div>
          <h3 style={styles.ctaTitle}>{t('results_cta_title')}</h3>
          <p style={styles.ctaDesc}>{t('results_cta_desc')}</p>
        </div>
        <a href="https://www.hiboostnutrition.com/shop" target="_blank" rel="noreferrer" style={styles.ctaBtn}>
          {t('results_cta_btn')}
        </a>
      </div>

      <div style={styles.disclaimer}>
        {t('results_disclaimer')}
      </div>
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
  const [showNutrition, setShowNutrition] = useState(false);
  const nf = product.nutrition || {};

  return (
    <div
      style={styles.productCard}
      onMouseEnter={() => setShowNutrition(true)}
      onMouseLeave={() => setShowNutrition(false)}
    >
      <div style={styles.productTop}>
        <div>
          <p style={styles.productName}>{product.name}</p>
          <p style={styles.productType}>
            {typeLabel(product.type)}
            {product.brand && <span style={styles.productBrand}> · {product.brand}</span>}
          </p>
        </div>
        
        {/* Quantity Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '2px' }}>
          <button onClick={onMinus} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '4px 10px', fontSize: 16, borderRadius: 4, color: '#475569', fontWeight: 'bold' }}>-</button>
          <div style={{ fontSize: 14, fontWeight: 700, width: 20, textAlign: 'center', color: '#0f172a' }}>{product.quantity}</div>
          <button onClick={onPlus} style={{ border: 'none', background: '#f97316', cursor: 'pointer', padding: '4px 10px', fontSize: 16, borderRadius: 4, color: '#fff', fontWeight: 'bold' }}>+</button>
        </div>
      </div>

      {/* Nutrition Facts tooltip — shown on hover */}
      {showNutrition && Object.keys(nf).length > 0 && (
        <div style={styles.nutritionTooltip}>
          <div style={styles.nfTitle}>{t('nf_title')} <span style={styles.nfServing}>{t('nf_per_serving')} ({product.servingSize || '1 unit'})</span></div>
          <div style={styles.nfGrid}>
            {nf.calories != null && <NfRow label={t('nf_calories')} value={`${nf.calories} kcal`} />}
            {nf.carbsG != null    && <NfRow label={t('nf_carbs')} value={`${nf.carbsG}g`} color="#f97316" />}
            {nf.sodiumMg != null  && <NfRow label={t('nf_sodium')} value={`${nf.sodiumMg}mg`} color="#3b82f6" />}
            {nf.potassiumMg != null && nf.potassiumMg > 0 && <NfRow label={t('nf_potassium')} value={`${nf.potassiumMg}mg`} color="#8b5cf6" />}
            {nf.proteinG != null && nf.proteinG > 0  && <NfRow label={t('nf_protein')} value={`${nf.proteinG}g`} color="#16a34a" />}
            {nf.caffeineMg != null && <NfRow label={t('nf_caffeine')} value={`${nf.caffeineMg}mg`} color="#dc2626" />}
          </div>
        </div>
      )}

      <p style={styles.productReason}>{product.reason}</p>
      <p style={styles.productUsage}>📋 {(() => {
        if (!product.usage) return '';
        const [key, param] = product.usage.split(':');
        const translated = t(key);
        if (param && translated) return translated.replace('{interval}', param);
        return translated || product.usage;
      })()}</p>
      <div style={styles.productFooter}>
        <span style={styles.productPrice}>
          {product.priceVND ? `${(product.priceVND * product.quantity).toLocaleString()} VND` : ''}
        </span>
        {product.url && (
          <a href={product.url} target="_blank" rel="noreferrer" style={styles.productLink}>
            View product →
          </a>
        )}
      </div>
    </div>
  );
}

function NfRow({ label, value, color }) {
  return (
    <div style={styles.nfRow}>
      <span style={styles.nfLabel}>{label}</span>
      <span style={{ ...styles.nfValue, color: color || '#1e293b' }}>{value}</span>
    </div>
  );
}

function typeLabel(type) {
  const map = { carb: '🍬 Carbohydrate', electrolyte: '🧂 Electrolyte', 'carb+fluid': '🍬💧 Carbs + Fluid', 'electrolyte+fluid': '🧂💧 Electrolyte + Fluid' };
  return map[type] || type;
}

function capitalise(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ') : '';
}

const styles = {
  container: { maxWidth: 1000, margin: '0 auto' },
  heroBanner: {
    background: 'linear-gradient(135deg, #fff7ed 0%, #fff 100%)',
    border: '1.5px solid #fed7aa', borderRadius: 16, padding: '28px 32px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    boxShadow: '0 2px 16px rgba(249,115,22,0.08)',
  },
  heroLeft: {},
  heroSubtitle: { fontSize: 13, color: '#f97316', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 6 },
  heroDetail: { fontSize: 14, color: '#64748b' },
  restartBtn: { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 20px', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  physioNote: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
    background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10,
    padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', lineHeight: 1.5,
  },
  physioIcon: { fontSize: 16, flexShrink: 0 },
  sweatTestBadge: {
    marginLeft: 8, background: '#dcfce7', border: '1px solid #86efac',
    borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600, color: '#15803d',
    whiteSpace: 'nowrap',
  },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 },
  metricCard: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
    padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },
  metricIcon: { fontSize: 26, marginBottom: 4 },
  metricValue: { fontSize: 28, fontWeight: 800 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  metricSub: { fontSize: 11, color: '#94a3b8' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 },
  section: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '24px 22px', marginBottom: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineSection: { marginBottom: 8 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f1f5f9', borderRadius: 8, padding: '7px 12px',
    marginBottom: 12, marginLeft: 0,
  },
  sectionHeaderIcon: { fontSize: 16 },
  sectionHeaderLabel: { fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
  timelineRow: { display: 'flex', gap: 14, paddingBottom: 14, borderLeft: '2px solid #e2e8f0', paddingLeft: 14, position: 'relative', marginLeft: 8 },
  timelineDot: { width: 10, height: 10, borderRadius: '50%', background: '#f97316', position: 'absolute', left: -6, top: 4, flexShrink: 0 },
  timelineContent: { flex: 1 },
  timelineHeader: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 },
  timelineTime: { fontSize: 13, fontWeight: 700, color: '#1e293b' },
  timelineNote: { fontSize: 11, color: '#94a3b8' },
  timelineNums: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pill: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  productList: { display: 'flex', flexDirection: 'column', gap: 12 },
  productCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 14px', position: 'relative', cursor: 'default' },
  productTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  productName: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  productType: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  productBrand: { fontWeight: 600, color: '#64748b' },

  // Nutrition Facts tooltip
  nutritionTooltip: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '12px 14px', marginBottom: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    animation: 'fadeIn 0.15s ease',
  },
  nfTitle: { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, borderBottom: '2px solid #0f172a', paddingBottom: 6 },
  nfServing: { fontSize: 11, fontWeight: 400, color: '#94a3b8' },
  nfGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  nfRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid #f1f5f9' },
  nfLabel: { fontSize: 12, color: '#64748b' },
  nfValue: { fontSize: 13, fontWeight: 700 },
  productQty: { background: '#f97316', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 13, fontWeight: 800 },
  productReason: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  productUsage: { fontSize: 12, color: '#94a3b8', marginBottom: 8 },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 12, fontWeight: 600, color: '#16a34a' },
  productLink: { fontSize: 12, color: '#f97316', textDecoration: 'none', fontWeight: 600 },
  tipList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  tipItem: { display: 'flex', gap: 10, fontSize: 13, color: '#374151', lineHeight: 1.5 },
  segGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  segCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 14px' },
  segTop: { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 },
  segIcon: { fontSize: 22 },
  segName: { fontSize: 14, fontWeight: 700, color: '#1e293b' },
  segDur: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  segNums: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  segNote: { fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 },
  tipBullet: { color: '#f97316', fontWeight: 700, flexShrink: 0 },
  ctaBanner: {
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    borderRadius: 14, padding: '24px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
  },
  ctaTitle: { fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 },
  ctaDesc: { fontSize: 14, color: '#fed7aa' },
  ctaBtn: { background: '#fff', color: '#ea580c', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  disclaimer: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 },
};
