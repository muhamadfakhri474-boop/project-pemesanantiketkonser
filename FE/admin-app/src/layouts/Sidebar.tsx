import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { paymentService } from '../api/services';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onNavigate: () => void;
}

/* ---------- Ikon garis (stroke) ---------- */
function Ic({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const GridIcon = () => (
  <Ic>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Ic>
);

const EventIcon = () => (
  <Ic>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Ic>
);

const MicIcon = () => (
  <Ic>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Ic>
);

const TicketIcon = () => (
  <Ic>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z" />
    <path d="M13 5v2M13 11v2M13 17v2" />
  </Ic>
);

const OrderIcon = () => (
  <Ic>
    <path d="M5 4h14v17l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V4z" />
    <path d="M9 9h6M9 13h6" />
  </Ic>
);

const VerifyIcon = () => (
  <Ic>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Ic>
);

const UserIcon = () => (
  <Ic>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Ic>
);

const PanelIcon = () => (
  <Ic>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Ic>
);

const LogoutIcon = () => (
  <Ic>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Ic>
);

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: <GridIcon /> },
  { to: '/events', label: 'Event / Konser', icon: <EventIcon /> },
  { to: '/artists', label: 'Penyanyi / Artis', icon: <MicIcon /> },
  { to: '/categories', label: 'Kategori Tiket', icon: <TicketIcon /> },
  { to: '/orders', label: 'Pesanan', icon: <OrderIcon /> },
  { to: '/payments', label: 'Verifikasi Pembayaran', icon: <VerifyIcon /> },
];

const sidebarStyles = `
.cadmin-sidebar {
  width: 240px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  background-color: #0a0f1c;
  border-right: 1px solid rgba(148, 163, 184, 0.10);
  display: flex;
  flex-direction: column;
  padding: 0 12px 14px;
  box-sizing: border-box;
  transition: width 0.2s ease;
}
.cadmin-sidebar.collapsed { width: 76px; }

/* Logo */
.cadmin-side-logo {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0 -12px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
  text-decoration: none;
  box-sizing: border-box;
}
.cadmin-sidebar.collapsed .cadmin-side-logo { justify-content: center; padding: 0; }

.cadmin-brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: #3b82f6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.30);
}
.cadmin-brand-text {
  color: #f8fafc;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  white-space: nowrap;
}
.cadmin-sidebar.collapsed .cadmin-brand-text { display: none; }

.cadmin-side-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.8px;
  color: #64748b;
  padding: 0 12px;
  margin: 20px 0 10px;
  text-transform: uppercase;
}
.cadmin-sidebar.collapsed .cadmin-side-label { display: none; }

.cadmin-side-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.cadmin-side-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
  position: relative;
}
.cadmin-side-item:hover { background-color: rgba(148, 163, 184, 0.08); color: #f8fafc; }
.cadmin-side-item.active { background-color: #1d4ed8; color: #ffffff; }
.cadmin-side-item.active:hover { background-color: #1d4ed8; }
.cadmin-side-item.active svg { color: #ffffff; }

.cadmin-side-badge {
  margin-left: auto;
  color: #f59e0b;
  font-size: 12px;
  font-weight: 700;
  padding: 0 2px;
}
.cadmin-sidebar.collapsed .cadmin-side-text,
.cadmin-sidebar.collapsed .cadmin-side-badge { display: none; }
.cadmin-sidebar.collapsed .cadmin-side-item { justify-content: center; padding: 10px; }

.cadmin-side-bottom {
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  margin: 10px -12px 0;
  padding: 10px 12px 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* ---------- Mobile drawer ---------- */
@media (max-width: 900px) {
  .cadmin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 60;
    width: 250px;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }
  .cadmin-sidebar.collapsed { width: 250px; }
  .cadmin-sidebar.collapsed .cadmin-side-text,
  .cadmin-sidebar.collapsed .cadmin-side-badge { display: inline; }
  .cadmin-sidebar.collapsed .cadmin-side-item { justify-content: flex-start; padding: 10px 12px; }
  .cadmin-sidebar.collapsed .cadmin-brand-text { display: inline; }
  .cadmin-sidebar.collapsed .cadmin-side-label { display: block; }
  .cadmin-sidebar.collapsed .cadmin-side-logo { justify-content: flex-start; padding: 0 18px; }
  .cadmin-sidebar.mobile-open { transform: translateX(0); }
  .cadmin-side-collapse { display: none !important; }
}
`;

export default function Sidebar({ collapsed, onToggle, mobileOpen, onNavigate }: SidebarProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () => {
      paymentService.getAll()
        .then((d) => {
          if (!active) return;
          const list = d?.data || d?.payments || d || [];
          setPendingCount(list.filter((p: { status: string }) => p.status === 'pending').length);
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`cadmin-sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
    >
      <style>{sidebarStyles}</style>

      <Link to="/" className="cadmin-side-logo" title="Ke beranda">
        <span className="cadmin-brand-mark" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="9" width="2.4" height="6" rx="1.2" fill="#ffffff" />
            <rect x="8.2" y="5" width="2.4" height="14" rx="1.2" fill="#ffffff" />
            <rect x="12.9" y="7.4" width="2.4" height="9.2" rx="1.2" fill="#ffffff" />
            <rect x="17.6" y="9.8" width="2.4" height="4.4" rx="1.2" fill="#ffffff" />
          </svg>
        </span>
        <span className="cadmin-brand-text">CONCERTA</span>
      </Link>

      <div className="cadmin-side-label">Menu</div>

      <nav className="cadmin-side-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `cadmin-side-item${isActive ? ' active' : ''}`
            }
            title={label}
            onClick={onNavigate}
          >
            {icon}
            <span className="cadmin-side-text">{label}</span>
            {to === '/payments' && pendingCount > 0 ? (
              <span className="cadmin-side-badge">{pendingCount}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="cadmin-side-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `cadmin-side-item${isActive ? ' active' : ''}`
          }
          title="Profil Admin"
          onClick={onNavigate}
        >
          <UserIcon />
          <span className="cadmin-side-text">Profil Admin</span>
        </NavLink>
        <button className="cadmin-side-item cadmin-side-collapse" onClick={onToggle} title="Collapse">
          <PanelIcon />
          <span className="cadmin-side-text">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
        <button className="cadmin-side-item" onClick={handleLogout} title="Logout">
          <LogoutIcon />
          <span className="cadmin-side-text">Logout</span>
        </button>
      </div>
    </aside>
  );
}
