import { useState } from 'react';

export default function StepContact({ form, update, back, submit, loading, error }) {
  const [touched, setTouched] = useState({});

  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  const errors = {
    firstName: !form.firstName?.trim() ? 'Vui lòng nhập tên' : null,
    lastName:  !form.lastName?.trim()  ? 'Vui lòng nhập họ' : null,
    email:     !form.email?.trim()     ? 'Vui lòng nhập email'
               : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Email không hợp lệ' : null,
    phone:     form.phone && !/^[0-9+\-\s()]{7,15}$/.test(form.phone) ? 'Số điện thoại không hợp lệ' : null,
  };

  const canSubmit = !errors.firstName && !errors.lastName && !errors.email && !errors.phone && !loading;

  const handleSubmit = () => {
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    if (canSubmit) submit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>📋</div>
        <h1 style={styles.title}>Nhận kế hoạch của bạn</h1>
        <p style={styles.subtitle}>
          Điền thông tin để nhận kế hoạch dinh dưỡng cá nhân hoá. Dữ liệu chỉ dùng để liên hệ hỗ trợ, không chia sẻ bên thứ ba.
        </p>

        <div style={styles.formGrid}>
          {/* Họ */}
          <Field
            label="Họ"
            required
            error={touched.lastName && errors.lastName}
          >
            <input
              style={{ ...styles.input, ...(touched.lastName && errors.lastName ? styles.inputError : {}) }}
              placeholder="Nguyễn"
              value={form.lastName || ''}
              onChange={e => update({ lastName: e.target.value })}
              onBlur={() => touch('lastName')}
            />
          </Field>

          {/* Tên */}
          <Field
            label="Tên"
            required
            error={touched.firstName && errors.firstName}
          >
            <input
              style={{ ...styles.input, ...(touched.firstName && errors.firstName ? styles.inputError : {}) }}
              placeholder="Văn A"
              value={form.firstName || ''}
              onChange={e => update({ firstName: e.target.value })}
              onBlur={() => touch('firstName')}
            />
          </Field>

          {/* Email */}
          <Field
            label="Email"
            required
            error={touched.email && errors.email}
            full
          >
            <input
              style={{ ...styles.input, ...(touched.email && errors.email ? styles.inputError : {}) }}
              placeholder="example@email.com"
              type="email"
              value={form.email || ''}
              onChange={e => update({ email: e.target.value })}
              onBlur={() => touch('email')}
            />
          </Field>

          {/* Số điện thoại */}
          <Field
            label="Số điện thoại"
            hint="Không bắt buộc"
            error={touched.phone && errors.phone}
            full
          >
            <input
              style={{ ...styles.input, ...(touched.phone && errors.phone ? styles.inputError : {}) }}
              placeholder="0901 234 567"
              type="tel"
              value={form.phone || ''}
              onChange={e => update({ phone: e.target.value })}
              onBlur={() => touch('phone')}
            />
          </Field>
        </div>

        {/* Privacy note */}
        <div style={styles.privacyNote}>
          🔒 Thông tin của bạn được bảo mật và chỉ dùng để cung cấp kế hoạch dinh dưỡng từ HiBoost.
        </div>

        {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

        <div style={styles.navRow}>
          <button style={styles.backBtn} onClick={back} disabled={loading}>← Quay lại</button>
          <button
            style={{ ...styles.submitBtn, opacity: canSubmit ? 1 : 0.5 }}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {loading ? '⏳ Đang tính toán...' : '🚀 Tạo Kế Hoạch →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, error, children, full }) {
  return (
    <div style={{ ...styles.fieldGroup, ...(full ? styles.fieldFull : {}) }}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
        {hint && <span style={styles.hint}> · {hint}</span>}
      </label>
      {children}
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '0 auto' },
  card: {
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
    padding: '40px 36px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  iconWrap: { fontSize: 36, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 28, textAlign: 'center' },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 20 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldFull: { gridColumn: '1 / -1' },
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  required: { color: '#f97316' },
  hint: { fontSize: 11, color: '#94a3b8', fontWeight: 400 },
  input: {
    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10,
    padding: '12px 14px', fontSize: 15, color: '#0f172a',
    outline: 'none', transition: 'border-color 0.2s',
    width: '100%', boxSizing: 'border-box',
  },
  inputError: { borderColor: '#fca5a5', background: '#fef2f2' },
  fieldError: { fontSize: 12, color: '#dc2626', marginTop: 2 },

  privacyNote: {
    background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
    padding: '10px 14px', fontSize: 12, color: '#166534', marginBottom: 20, lineHeight: 1.5,
  },
  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '12px 16px', color: '#dc2626', marginBottom: 20, fontSize: 14,
  },
  navRow: { display: 'flex', gap: 12, marginTop: 4 },
  backBtn: {
    background: '#f1f5f9', border: 'none', borderRadius: 8,
    padding: '13px 24px', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 14,
  },
  submitBtn: {
    flex: 1, background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none',
    borderRadius: 8, padding: '14px 28px', color: '#fff', cursor: 'pointer',
    fontWeight: 700, fontSize: 15, boxShadow: '0 2px 12px rgba(249,115,22,0.35)',
    transition: 'opacity 0.2s',
  },
};
