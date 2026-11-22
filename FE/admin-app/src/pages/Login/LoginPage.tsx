/* =============================================================
   LOGIN PAGE — CONCERTA
   Layout split-screen:
     Kiri  : visual konser + logo + headline
     Kanan : form login administrator dalam kartu dark modern
   ============================================================= */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import concertImg from '../../assets/concert-hero.jpg';

/* ---------- Ikon ---------- */

type IconProps = { size?: number };

function MailIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function KeyIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* Logo: kotak biru rounded + waveform + wordmark */
function BrandLogo() {
  return (
    <span className="cl-brand">
      <span className="cl-brand-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="9" width="2.4" height="6" rx="1.2" fill="#ffffff" />
          <rect x="8.2" y="5" width="2.4" height="14" rx="1.2" fill="#ffffff" />
          <rect x="12.9" y="7.4" width="2.4" height="9.2" rx="1.2" fill="#ffffff" />
          <rect x="17.6" y="9.8" width="2.4" height="4.4" rx="1.2" fill="#ffffff" />
        </svg>
      </span>
      <span className="cl-brand-text">CONCERTA</span>
    </span>
  );
}

/* =============================================================
   HALAMAN LOGIN
   ============================================================= */

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState(() => localStorage.getItem('admin_remember') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('admin_remember')));

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillDemo = () => {
    setIdentifier('admin123@gmail.com');
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Email wajib diisi');
      return;
    }

    if (!password) {
      setError('Password wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(identifier.trim(), password);
      const token = res?.token || res?.data?.token;
      const user = res?.user || res?.data?.user;
      if (!token) throw new Error('Token tidak ditemukan');

      if (rememberMe) {
        localStorage.setItem('admin_remember', identifier.trim());
      } else {
        localStorage.removeItem('admin_remember');
      }

      login(user, token);
      navigate('/admin');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Login gagal. Periksa kembali email dan password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-page">
      {/* ========================================================== */}
      {/* PANEL KIRI — visual konser                                 */}
      {/* ========================================================== */}
      <section className="cl-visual">
        <div
          className="cl-visual-bg"
          style={{ backgroundImage: `url(${concertImg})` }}
        />
        <div className="cl-visual-overlay" />

        <div className="cl-visual-inner">
          <Link to="/" className="cl-brand-link" aria-label="Kembali ke beranda">
            <BrandLogo />
          </Link>

          <div className="cl-visual-copy">
            <span className="cl-visual-tag">Admin Management Suite</span>
            <h1 className="cl-visual-title">
              Manage Every Concert,
              <br />
              Make Every Moment
              <br />
              Count.
            </h1>
            <p className="cl-visual-sub">
              Sistem backend terpadu untuk monitoring penjualan tiket, verifikasi pembayaran,
              dan manajemen artis konser.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* PANEL KANAN — form login dalam kartu dark modern           */}
      {/* ========================================================== */}
      <section className="cl-form-side">
        <Link to="/" className="cl-back-link">
          <ArrowLeftIcon size={16} />
          <span>Kembali ke Beranda</span>
        </Link>

        <div className="cl-form-outer">
          <div className="cl-card">
            <div className="cl-card-glow" />

            <header className="cl-form-head">
              <div className="cl-badge">
                <ShieldCheckIcon size={13} />
                <span>Portal Administrator</span>
              </div>
              <h2 className="cl-form-title">Welcome Back</h2>
              <p className="cl-form-sub">
                Masuk untuk mengelola data konser dan tiket Conserta.
              </p>
            </header>

            {error && (
              <div className="cl-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="cl-stack">
              {/* Email */}
              <div className="cl-field">
                <label className="cl-label" htmlFor="cl-email">
                  Email Administrator
                </label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">
                    <MailIcon size={18} />
                  </span>
                  <input
                    id="cl-email"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="admin123@gmail.com"
                    className="cl-input"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="cl-field">
                <label className="cl-label" htmlFor="cl-password">
                  Password
                </label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">
                    <LockIcon size={18} />
                  </span>
                  <input
                    id="cl-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Masukkan password"
                    className="cl-input cl-input-pw"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="cl-eye"
                    aria-label={
                      showPassword ? 'Sembunyikan password' : 'Lihat password'
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me — Custom dark checkbox (bebas kotak putih) */}
              <label className="cl-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="cl-check-native"
                  disabled={loading}
                />
                <span className={`cl-custom-check ${rememberMe ? 'checked' : ''}`}>
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="cl-check-text">Remember Me</span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading} className="cl-submit">
                {loading ? (
                  <span className="cl-submit-loading">
                    <span className="cl-spinner" /> Memproses...
                  </span>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </button>
            </form>

            {/* Akun demo — 1-click auto fill */}
            <div className="cl-demo">
              <div className="cl-demo-top">
                <span className="cl-demo-icon">
                  <KeyIcon size={14} />
                </span>
                <div className="cl-demo-text-wrap">
                  <span className="cl-demo-title">Akun Demo Administrator</span>
                  <span className="cl-demo-creds">admin123@gmail.com &middot; admin123</span>
                </div>
              </div>
              <button
                type="button"
                className="cl-demo-btn"
                onClick={fillDemo}
                disabled={loading}
              >
                Gunakan Akun Ini
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{loginStyles}</style>
    </div>
  );
}

/* =============================================================
   STYLING — Modern Navy & Blue Theme (Anti-White, Anti-Boxy)
   ============================================================= */

const loginStyles = `
.cl-page {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #0b1120;
  color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cl-page button,
.cl-page input {
  font-family: inherit;
}

/* ---------------- Panel kiri ---------------- */
.cl-visual {
  position: relative;
  flex: 0 0 50%;
  min-height: 100vh;
  overflow: hidden;
  background-color: #070b14;
}

.cl-visual-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.02);
}

.cl-visual-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.22) 0%, transparent 60%),
    linear-gradient(90deg, rgba(11, 17, 32, 0.6) 0%, rgba(11, 17, 32, 0.3) 55%, rgba(11, 17, 32, 0.85) 100%),
    linear-gradient(180deg, rgba(11, 17, 32, 0.7) 0%, rgba(11, 17, 32, 0.2) 40%, rgba(11, 17, 32, 0.95) 100%);
}

.cl-visual-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: 44px 56px 64px;
  box-sizing: border-box;
}

.cl-brand-link {
  display: inline-flex;
  text-decoration: none;
  align-self: flex-start;
}

.cl-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.cl-brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.38);
}

.cl-brand-text {
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2.4px;
}

.cl-visual-copy {
  max-width: 580px;
}

.cl-visual-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.14);
  border: 1px solid rgba(59, 130, 246, 0.28);
  padding: 5px 13px;
  border-radius: 999px;
  margin-bottom: 20px;
}

.cl-visual-title {
  margin: 0;
  color: #ffffff;
  font-size: 42px;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -1.2px;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.cl-visual-sub {
  margin: 20px 0 0;
  color: #cbd5e1;
  font-size: 15.5px;
  line-height: 1.6;
}

/* ---------------- Panel kanan ---------------- */
.cl-form-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #0b1120;
  background-image:
    radial-gradient(circle at 85% 15%, rgba(59, 130, 246, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 10% 85%, rgba(29, 78, 216, 0.08) 0%, transparent 50%);
  padding: 34px 56px 48px;
  box-sizing: border-box;
  min-height: 100vh;
}

.cl-back-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  background-color: rgba(148, 163, 184, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 999px;
  padding: 8px 16px;
  transition: all 0.16s ease;
}

.cl-back-link:hover {
  color: #f8fafc;
  background-color: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.22);
}

.cl-form-outer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}

/* Kartu Form (Elegan, Rounded 24px, Dark Navy) */
.cl-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: linear-gradient(180deg, #16233a 0%, #101a2c 100%);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 24px;
  padding: 38px 36px;
  box-sizing: border-box;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(59, 130, 246, 0.06);
  overflow: hidden;
}

.cl-card-glow {
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  opacity: 0.8;
}

.cl-form-head {
  margin-bottom: 26px;
}

.cl-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.24);
  border-radius: 999px;
  padding: 4px 11px;
  margin-bottom: 12px;
}

.cl-form-title {
  margin: 0;
  color: #f8fafc;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.6px;
  line-height: 1.2;
}

.cl-form-sub {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13.5px;
  line-height: 1.5;
}

/* Error */
.cl-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  border-radius: 12px;
  padding: 11px 14px;
  font-size: 13px;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Form */
.cl-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cl-field {
  display: flex;
  flex-direction: column;
}

.cl-label {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.cl-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.cl-input-wrap:focus-within {
  border-color: #3b82f6;
  background-color: #0b1320;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.cl-input-icon {
  position: absolute;
  left: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  pointer-events: none;
}

.cl-input-wrap:focus-within .cl-input-icon {
  color: #60a5fa;
}

.cl-input {
  width: 100%;
  height: 48px;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 14px 0 43px;
  font-size: 14px;
  color: #f8fafc;
  box-sizing: border-box;
  border-radius: 14px;
}

.cl-input.cl-input-pw {
  padding-right: 46px;
}

.cl-input::placeholder {
  color: #64748b;
}

.cl-input:disabled {
  opacity: 0.65;
}

/* KUNCI: Cegah browser autofill mengubah background menjadi putih */
.cl-input:-webkit-autofill,
.cl-input:-webkit-autofill:hover,
.cl-input:-webkit-autofill:focus,
.cl-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 1000px #0e1828 inset !important;
  -webkit-text-fill-color: #f8fafc !important;
  caret-color: #f8fafc !important;
  transition: background-color 5000s ease-in-out 0s;
  border-radius: 14px;
}

.cl-eye {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.16s ease, background-color 0.16s ease;
}

.cl-eye:hover {
  color: #f8fafc;
  background-color: rgba(148, 163, 184, 0.1);
}

/* Remember me — Custom Dark Checkbox (BEBAS KOTAK PUTIH NATIVE) */
.cl-check {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  margin-top: -2px;
  align-self: flex-start;
}

.cl-check-native {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.cl-custom-check {
  width: 19px;
  height: 19px;
  border-radius: 6px;
  background-color: #0e1828;
  border: 1.5px solid rgba(148, 163, 184, 0.28);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  transition: all 0.16s ease;
  flex-shrink: 0;
}

.cl-check:hover .cl-custom-check {
  border-color: rgba(59, 130, 246, 0.5);
}

.cl-custom-check.checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}

.cl-check-text {
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 500;
}

/* Submit — Smooth Rounded 14px + Gradient */
.cl-submit {
  width: 100%;
  height: 48px;
  margin-top: 4px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.35);
  transition: transform 0.14s ease, filter 0.14s ease, box-shadow 0.14s ease;
}

.cl-submit:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.42);
}

.cl-submit:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.cl-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cl-submit-loading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cl-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: cl-spin 0.6s linear infinite;
}

@keyframes cl-spin {
  to { transform: rotate(360deg); }
}

/* Akun demo — Card halus dengan 1-click auto-fill */
.cl-demo {
  margin-top: 24px;
  background-color: rgba(14, 24, 40, 0.65);
  border: 1px dashed rgba(59, 130, 246, 0.32);
  border-radius: 14px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cl-demo-top {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cl-demo-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cl-demo-text-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cl-demo-title {
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}

.cl-demo-creds {
  color: #94a3b8;
  font-size: 11.5px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cl-demo-btn {
  height: 30px;
  padding: 0 12px;
  background-color: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.cl-demo-btn:hover {
  background-color: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

/* ---------------- Responsive ---------------- */
@media (max-width: 1180px) {
  .cl-visual-inner {
    padding: 36px 40px 52px;
  }
  .cl-visual-title {
    font-size: 36px;
  }
  .cl-form-side {
    padding: 30px 36px 44px;
  }
}

@media (max-width: 960px) {
  .cl-page {
    flex-direction: column;
  }

  .cl-visual {
    flex: none;
    min-height: 280px;
  }

  .cl-visual-inner {
    min-height: 280px;
    padding: 26px 24px 32px;
  }

  .cl-visual-title {
    font-size: 28px;
    letter-spacing: -0.8px;
  }

  .cl-visual-sub {
    font-size: 14px;
    margin-top: 12px;
  }

  .cl-form-side {
    min-height: auto;
    padding: 24px 20px 48px;
  }

  .cl-form-outer {
    align-items: flex-start;
    padding: 20px 0 0;
  }

  .cl-card {
    padding: 28px 22px;
    border-radius: 20px;
  }
}

@media (max-width: 520px) {
  .cl-demo {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .cl-demo-btn {
    width: 100%;
  }
}
`;
