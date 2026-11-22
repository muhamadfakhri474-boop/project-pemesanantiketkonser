import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/* ---------- Ikon garis ---------- */
function Ic({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const UserIcon = () => (<Ic size={18}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Ic>);
const MailIcon = () => (<Ic><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></Ic>);
const ShieldIcon = () => (<Ic size={18}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Ic>);
const LockIcon = () => (<Ic><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Ic>);
const CheckIcon = () => (<Ic size={15}><path d="M20 6 9 17l-5-5" /></Ic>);
const LogoutIcon = () => (<Ic size={15}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Ic>);
const CameraIcon = () => (<Ic size={14}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" /><circle cx="12" cy="13" r="3" /></Ic>);

const styles = `
.cadmin-page { display: flex; flex-direction: column; gap: 18px; }

.cadmin-card {
  background-color: #16233a;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 22px 24px;
  box-sizing: border-box;
  min-width: 0;
}

.cadmin-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cadmin-h1 { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0; letter-spacing: -0.2px; }
.cadmin-sub { font-size: 13px; color: #94a3b8; margin: 5px 0 0; }

.cadmin-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 18px; align-items: start; }
@media (max-width: 980px) { .cadmin-grid { grid-template-columns: 1fr; } }

/* ---------- Kartu ringkasan ---------- */
.cadmin-summary { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 28px; }

.cadmin-avatar-wrap { position: relative; }
.cadmin-avatar-lg {
  width: 96px; height: 96px; border-radius: 50%;
  background: linear-gradient(140deg, #3b82f6, #1d4ed8);
  color: #ffffff; font-size: 32px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 26px rgba(59, 130, 246, 0.35);
  letter-spacing: 1px;
}
.cadmin-avatar-edit {
  position: absolute; right: -2px; bottom: -2px;
  width: 30px; height: 30px; border-radius: 50%;
  border: 3px solid #16233a; background-color: #334155; color: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background-color 0.15s ease;
}
.cadmin-avatar-edit:hover { background-color: #475569; }

.cadmin-sum-name { font-size: 17px; font-weight: 700; color: #f8fafc; margin: 16px 0 0; }
.cadmin-sum-mail { font-size: 12.5px; color: #94a3b8; margin: 4px 0 0; word-break: break-all; }
.cadmin-sum-role {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 12px; padding: 5px 11px; border-radius: 999px;
  background-color: rgba(59, 130, 246, 0.16); color: #93c5fd;
  font-size: 11.5px; font-weight: 700; letter-spacing: 0.3px;
  text-transform: capitalize;
}

.cadmin-divider { height: 1px; background-color: rgba(148, 163, 184, 0.12); margin: 20px 0 16px; }

.cadmin-info-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 9px 0; }
.cadmin-info-label { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #94a3b8; }
.cadmin-info-value { font-size: 12.5px; font-weight: 600; color: #e2e8f0; text-align: right; }

/* ---------- Form ---------- */
.cadmin-section-title { font-size: 14.5px; font-weight: 700; color: #f8fafc; margin: 0; }
.cadmin-section-sub { font-size: 12.5px; color: #94a3b8; margin: 4px 0 0; }

.cadmin-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
@media (max-width: 640px) { .cadmin-form { grid-template-columns: 1fr; } }

.cadmin-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.cadmin-label { font-size: 12.5px; font-weight: 600; color: #cbd5e1; }

.cadmin-input-wrap { position: relative; }
.cadmin-input-wrap svg { position: absolute; left: 12px; top: 12px; color: #64748b; pointer-events: none; }
.cadmin-input {
  width: 100%; height: 42px; box-sizing: border-box;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 9px; color: #e2e8f0;
  font-family: inherit; font-size: 13.5px; padding: 0 12px;
  outline: none; transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.cadmin-input.has-icon { padding-left: 38px; }
.cadmin-input::placeholder { color: #64748b; }
.cadmin-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16); }
.cadmin-input:disabled { opacity: 0.6; cursor: not-allowed; }

.cadmin-form-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-top: 20px;
  padding-top: 18px; border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.cadmin-note { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #64748b; }
.cadmin-note.ok { color: #22c55e; }

.cadmin-actions { display: flex; align-items: center; gap: 10px; }

.cadmin-btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 40px; padding: 0 18px;
  background-color: #3b82f6; color: #ffffff;
  border: none; border-radius: 9px;
  font-family: inherit; font-size: 13.5px; font-weight: 700;
  cursor: pointer; transition: background-color 0.15s ease;
}
.cadmin-btn-primary:hover { background-color: #2563eb; }
.cadmin-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.cadmin-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 40px; padding: 0 16px; border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.18); background: transparent;
  color: #94a3b8; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-btn-ghost:hover { background-color: rgba(148, 163, 184, 0.08); color: #ffffff; }

.cadmin-btn-danger {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 40px; padding: 0 16px; border-radius: 9px;
  border: 1px solid rgba(248, 113, 113, 0.28); background: transparent;
  color: #f87171; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background-color 0.15s ease;
}
.cadmin-btn-danger:hover { background-color: rgba(248, 113, 113, 0.1); }

/* ---------- Keamanan ---------- */
.cadmin-security { display: flex; gap: 14px; align-items: flex-start; }
.cadmin-security-icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  background-color: rgba(59, 130, 246, 0.14); color: #60a5fa;
  display: flex; align-items: center; justify-content: center;
}
.cadmin-security-body { flex: 1; min-width: 0; }
.cadmin-security-title { font-size: 13.5px; font-weight: 700; color: #f8fafc; margin: 0; }
.cadmin-security-text { font-size: 12.5px; color: #94a3b8; margin: 5px 0 0; line-height: 1.6; }

.cadmin-tip {
  display: flex; align-items: flex-start; gap: 9px;
  margin-top: 16px; padding: 12px 14px; border-radius: 10px;
  background-color: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.18);
  font-size: 12px; color: #fbbf24; line-height: 1.55;
}
`;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.name, user?.email]);

  const displayName = user?.name ?? 'Admin Concerta';
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [displayName]
  );

  const dirty = name !== (user?.name ?? '') || email !== (user?.email ?? '');
  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email.trim());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    updateUser({ name: name.trim(), email: email.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cadmin-page">
      <style>{styles}</style>

      <div className="cadmin-head">
        <div>
          <h2 className="cadmin-h1">Profil Admin</h2>
          <p className="cadmin-sub">Kelola informasi akun dan keamanan akun administrator Anda.</p>
        </div>
      </div>

      <div className="cadmin-grid">
        {/* ---------- Ringkasan akun ---------- */}
        <section className="cadmin-card">
          <div className="cadmin-summary">
            <div className="cadmin-avatar-wrap">
              <div className="cadmin-avatar-lg">{initials}</div>
              <button className="cadmin-avatar-edit" title="Ubah foto profil" type="button">
                <CameraIcon />
              </button>
            </div>
            <h3 className="cadmin-sum-name">{displayName}</h3>
            <p className="cadmin-sum-mail">{user?.email ?? '-'}</p>
            <span className="cadmin-sum-role">
              <ShieldIcon /> {user?.role ?? 'Administrator'}
            </span>
          </div>

          <div className="cadmin-divider" />

          <div className="cadmin-info-row">
            <span className="cadmin-info-label">
              <UserIcon /> ID Admin
            </span>
            <span className="cadmin-info-value">#{String(user?.id ?? 0).padStart(4, '0')}</span>
          </div>
          <div className="cadmin-info-row">
            <span className="cadmin-info-label">
              <ShieldIcon /> Hak Akses
            </span>
            <span className="cadmin-info-value">Full Access</span>
          </div>
          <div className="cadmin-info-row">
            <span className="cadmin-info-label">
              <LockIcon /> Status Akun
            </span>
            <span className="cadmin-info-value" style={{ color: '#22c55e' }}>Aktif</span>
          </div>
        </section>

        {/* ---------- Kolom kanan ---------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="cadmin-card">
            <h3 className="cadmin-section-title">Informasi Pribadi</h3>
            <p className="cadmin-section-sub">Perubahan akan disimpan pada perangkat ini.</p>

            <form className="cadmin-form" onSubmit={handleSave}>
              <div className="cadmin-field">
                <label className="cadmin-label" htmlFor="profile-name">Nama Lengkap</label>
                <div className="cadmin-input-wrap">
                  <UserIcon />
                  <input
                    id="profile-name"
                    className="cadmin-input has-icon"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama admin"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="cadmin-field">
                <label className="cadmin-label" htmlFor="profile-email">Alamat Email</label>
                <div className="cadmin-input-wrap">
                  <MailIcon />
                  <input
                    id="profile-email"
                    type="email"
                    className="cadmin-input has-icon"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@concerta.id"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="cadmin-field">
                <label className="cadmin-label" htmlFor="profile-role">Peran</label>
                <input
                  id="profile-role"
                  className="cadmin-input"
                  value={user?.role ?? 'Administrator'}
                  disabled
                />
              </div>

              <div className="cadmin-field">
                <label className="cadmin-label" htmlFor="profile-status">Status</label>
                <input id="profile-status" className="cadmin-input" value="Aktif" disabled />
              </div>

              <div className="cadmin-form-foot" style={{ gridColumn: '1 / -1' }}>
                {saved ? (
                  <span className="cadmin-note ok">
                    <CheckIcon /> Perubahan berhasil disimpan
                  </span>
                ) : (
                  <span className="cadmin-note">Pastikan nama dan email sudah benar.</span>
                )}
                <div className="cadmin-actions">
                  <button
                    type="button"
                    className="cadmin-btn-ghost"
                    onClick={() => {
                      setName(user?.name ?? '');
                      setEmail(user?.email ?? '');
                    }}
                    disabled={!dirty}
                  >
                    Reset
                  </button>
                  <button type="submit" className="cadmin-btn-primary" disabled={!dirty || !valid}>
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="cadmin-card">
            <div className="cadmin-security">
              <div className="cadmin-security-icon">
                <LockIcon />
              </div>
              <div className="cadmin-security-body">
                <h3 className="cadmin-security-title">Keamanan Akun</h3>
                <p className="cadmin-security-text">
                  Kata sandi Anda terakhir diperbarui 30 hari lalu. Gunakan kombinasi huruf, angka,
                  dan simbol agar akun tetap aman.
                </p>
                <div className="cadmin-tip">
                  <ShieldIcon />
                  <span>
                    Perubahan email tidak mengubah kredensial login pada server. Hubungi tim teknis
                    bila perlu memperbarui email akun utama.
                  </span>
                </div>
              </div>
            </div>

            <div className="cadmin-form-foot">
              <span className="cadmin-note">Sesi aktif di perangkat ini</span>
              <div className="cadmin-actions">
                <button type="button" className="cadmin-btn-danger" onClick={handleLogout}>
                  <LogoutIcon /> Keluar dari Akun
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
