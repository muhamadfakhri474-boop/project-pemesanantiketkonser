import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Sidebar from './Sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/events': 'Event / Konser',
  '/artists': 'Penyanyi / Artis',
  '/categories': 'Kategori Tiket',
  '/orders': 'Pesanan',
  '/payments': 'Verifikasi Pembayaran',
  '/profile': 'Profil Admin',
};

const NOTIFICATIONS: { title: string; time: string }[] = [];

const layoutStyles = `
.cadmin-shell {
  display: flex;
  min-height: 100vh;
  background-color: #0b1120;
  color: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cadmin-main {
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0b1120;
}

.cadmin-topbar {
  height: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 26px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
  background-color: #0b1120;
}

.cadmin-topbar-title {
  font-size: 15.5px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.cadmin-topbar-crumb {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
}
.cadmin-topbar-crumb .cadmin-crumb-sep { color: #475569; margin: 0 5px; }

.cadmin-topbar-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cadmin-bell {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  border: none;
  background-color: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.cadmin-bell:hover { color: #f8fafc; background-color: rgba(148, 163, 184, 0.08); }

.cadmin-bell-dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #3b82f6;
  border: 2px solid #0b1120;
}

.cadmin-pop {
  position: absolute;
  top: 46px;
  right: 0;
  width: 300px;
  background-color: #131f33;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
  z-index: 40;
}

.cadmin-notif-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background-color 0.15s ease;
}
.cadmin-notif-item:hover { background-color: rgba(148, 163, 184, 0.06); }
.cadmin-notif-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #3b82f6;
  flex-shrink: 0;
  margin-top: 5px;
}
.cadmin-notif-title { font-size: 12.5px; color: #e2e8f0; line-height: 1.45; }
.cadmin-notif-time { font-size: 11px; color: #64748b; margin-top: 3px; }
.cadmin-notif-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 26px 16px; text-align: center;
}
.cadmin-notif-empty-icon {
  width: 42px; height: 42px; border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.12); color: #60a5fa;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.cadmin-notif-empty-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.cadmin-notif-empty-text { font-size: 11.5px; color: #94a3b8; line-height: 1.5; }

.cadmin-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.15s ease;
}
.cadmin-profile:hover { background-color: rgba(148, 163, 184, 0.06); }

.cadmin-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cadmin-profile-name {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  text-align: left;
  line-height: 1.2;
}
.cadmin-profile-role { font-size: 11px; color: #94a3b8; text-align: left; margin-top: 1px; }

.cadmin-profile-chevron { color: #64748b; }

.cadmin-pop-head {
  padding: 10px 12px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}
.cadmin-pop-name { font-size: 13px; font-weight: 600; color: #f8fafc; }
.cadmin-profile-email {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 3px;
}

.cadmin-pop-link {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-pop-link:hover { background-color: rgba(148, 163, 184, 0.08); color: #ffffff; }

.cadmin-logout-btn {
  width: 100%;
  border: none;
  background: transparent;
  color: #f87171;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.cadmin-logout-btn:hover { background-color: rgba(248, 113, 113, 0.08); }

.cadmin-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 26px 32px;
  background-color: #0b1120;
}

/* ---------- Mobile ---------- */
.cadmin-burger {
  display: none;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 9px;
  border: none;
  background-color: transparent;
  color: #94a3b8;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.cadmin-burger:hover { background-color: rgba(148, 163, 184, 0.08); color: #ffffff; }

.cadmin-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(3, 7, 18, 0.6);
  z-index: 55;
  border: none;
  padding: 0;
}

@media (max-width: 900px) {
  .cadmin-burger { display: flex; }
  .cadmin-topbar { padding: 0 14px; gap: 10px; }
  .cadmin-topbar-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
  .cadmin-topbar-title { font-size: 14.5px; }
  .cadmin-topbar-crumb { display: none; }
  .cadmin-profile-name, .cadmin-profile-role { display: none; }
  .cadmin-profile { padding: 4px; }
  .cadmin-content { padding: 16px 14px 28px; }
}
`;

export default function AdminLayout() {
  const { isAuthenticated, hydrated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'notif' | 'profile' | null>(null);

  /* Scroll ke atas & tutup dropdown saat pindah halaman */
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  /* Tutup dropdown saat klik di luar */
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenu]);

  if (!hydrated) {
    return <div style={{ minHeight: '100vh', background: '#0b1120' }} />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const title = PAGE_TITLES[location.pathname] ?? 'Dashboard';
  const displayName = user?.name ?? 'Admin Concerta';
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cadmin-shell">
      <style>{layoutStyles}</style>

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          className="cadmin-overlay"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="cadmin-main">
        <header className="cadmin-topbar">
          <div className="cadmin-topbar-left">
            <button
              className="cadmin-burger"
              onClick={() => setMobileOpen(true)}
              title="Buka menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="cadmin-topbar-title">{title}</h1>
              <div className="cadmin-topbar-crumb">
                Admin <span className="cadmin-crumb-sep">›</span> {title}
              </div>
            </div>
          </div>

          <div
            className="cadmin-topbar-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Notifikasi */}
            <button
              className="cadmin-bell"
              onClick={() => setOpenMenu((m) => (m === 'notif' ? null : 'notif'))}
              title="Notifikasi"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {NOTIFICATIONS.length > 0 && <span className="cadmin-bell-dot" />}
            </button>

            {openMenu === 'notif' && (
              <div className="cadmin-pop">
                {NOTIFICATIONS.length === 0 ? (
                  <div className="cadmin-notif-empty">
                    <div className="cadmin-notif-empty-icon">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                    </div>
                    <div className="cadmin-notif-empty-title">Belum ada notifikasi</div>
                    <div className="cadmin-notif-empty-text">
                      Pemberitahuan pesanan dan pembayaran baru akan muncul di sini.
                    </div>
                  </div>
                ) : (
                  NOTIFICATIONS.map((n) => (
                    <div className="cadmin-notif-item" key={n.title}>
                      <span className="cadmin-notif-dot" />
                      <div>
                        <div className="cadmin-notif-title">{n.title}</div>
                        <div className="cadmin-notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Profil */}
            <button
              className="cadmin-profile"
              onClick={() => setOpenMenu((m) => (m === 'profile' ? null : 'profile'))}
            >
              <span className="cadmin-avatar">{initials}</span>
              <span>
                <div className="cadmin-profile-name">{displayName}</div>
                <div className="cadmin-profile-role">
                  {user?.role ?? 'Administrator'}
                </div>
              </span>
              <svg
                className="cadmin-profile-chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {openMenu === 'profile' && (
              <div className="cadmin-pop" style={{ width: 240 }}>
                <div className="cadmin-pop-head">
                  <div className="cadmin-pop-name">{displayName}</div>
                  <div className="cadmin-profile-email">{user?.email ?? '-'}</div>
                </div>
                <Link to="/profile" className="cadmin-pop-link">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                  Profil Admin
                </Link>
                <button className="cadmin-logout-btn" onClick={handleLogout}>
                  Keluar
                </button>
              </div>
            )}
          </div>
        </header>

        <main ref={contentRef} className="cadmin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
