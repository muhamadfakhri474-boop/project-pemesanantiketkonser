/* =============================================================
   HALAMAN DASHBOARD ADMIN — CONSERTA
   4 kartu statistik, Ticket Sales Overview, Upcoming Concerts,
   dan Recent Orders. Seluruh data diambil dari API admin.
   ============================================================= */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardService, eventService, orderService } from '../../api/services';
import { useRealtime } from '../../hooks/useRealtime';

/* ---------- Ikon garis (stroke) ---------- */
function Ic({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
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

const CalendarIcon = () => (
  <Ic>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Ic>
);

const TicketIcon = () => (
  <Ic>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z" />
    <path d="M13 5v2M13 11v2M13 17v2" />
  </Ic>
);

const ReceiptIcon = () => (
  <Ic>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Ic>
);

const RadioIcon = () => (
  <Ic>
    <circle cx="12" cy="12" r="2" />
    <path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4" />
  </Ic>
);

/* ---------- Tipe ---------- */
interface QuotaStat {
  id: number;
  kategori: string;
  quota: number;
  remaining_quota: number;
  terjual: number;
  event_title: string;
}
interface DashboardSummary {
  total_revenue: number;
  total_customer: number;
  total_event: number;
  event_open: number | null;
  event_closed: number | null;
  pending_payments: number;
}
interface DashboardData {
  summary: DashboardSummary;
  order_stats: { payment_status: string; total: number }[];
  quota_per_category: QuotaStat[];
}
interface EventLite {
  id: number; title: string; venue: string; city: string;
  event_date: string; event_time: string; status: 'open' | 'closed';
  poster?: string | null; artist_name?: string;
}
interface OrderLite {
  id: number; customer_name?: string; event_title?: string;
  category?: string | null; qty?: number | null;
  payment_status: string; total_price: number; order_date: string;
}

const API_ORIGIN = 'http://localhost:3000';
const imgUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}/${path.replace(/\\/g, '/')}`;
};
const placeholder = (label: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <rect width='120' height='120' fill='#1c2b45'/>
    <text x='60' y='74' font-family='Arial' font-size='40' font-weight='800' fill='#3b82f6' text-anchor='middle'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
const orderIdLabel = (id: number) => `ORD-${String(id).padStart(5, '0')}`;
const SEGMENT_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#334155', '#60a5fa', '#475569'];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  failed: 'Failed',
  expired: 'Expired',
};

function pillClass(status: string) {
  if (status === 'pending') return 'cadmin-pill pending';
  if (status === 'paid') return 'cadmin-pill open';
  if (status === 'rejected' || status === 'failed') return 'cadmin-pill rejected';
  return 'cadmin-pill closed';
}

/* ============================================================= */

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  let cancelled = false;

  useEffect(() => {
    cancelled = false;

    Promise.all([
      dashboardService.getSummary().catch(() => null),
      eventService.getAll().catch(() => []),
      orderService.getAll().catch(() => []),
    ]).then(([summary, eventList, orderList]) => {
      if (cancelled) return;
      setDashboard(summary as DashboardData | null);
      setEvents(eventList?.data || eventList?.events || eventList || []);
      setOrders(orderList?.data || orderList?.orders || orderList || []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Real-time listener: refresh dashboard saat ada perubahan
  useRealtime('dashboard:changed', () => {
    if (cancelled) return;
    Promise.all([
      dashboardService.getSummary().catch(() => null),
      eventService.getAll().catch(() => []),
      orderService.getAll().catch(() => []),
    ]).then(([summary, eventList, orderList]) => {
      if (cancelled) return;
      setDashboard(summary as DashboardData | null);
      setEvents(eventList?.data || eventList?.events || eventList || []);
      setOrders(orderList?.data || orderList?.orders || orderList || []);
      setLoading(false);
    });
  }, [dashboard, events.length, orders.length, cancelled]);

  const quotaStats = useMemo(() => dashboard?.quota_per_category ?? [], [dashboard]);
  const summary = dashboard?.summary;

  const { totalQuota, totalSold, soldPct, remaining } = useMemo(() => {
    const q = quotaStats.reduce((sum, c) => sum + Number(c.quota || 0), 0);
    const s = quotaStats.reduce((sum, c) => sum + Number(c.terjual || 0), 0);
    return {
      totalQuota: q,
      totalSold: s,
      soldPct: q > 0 ? Math.round((s / q) * 100) : 0,
      remaining: Math.max(0, q - s),
    };
  }, [quotaStats]);

  const categoryLegend = useMemo(() => {
    const map = new Map<string, number>();
    quotaStats.forEach((c) => {
      map.set(c.kategori, (map.get(c.kategori) ?? 0) + Number(c.terjual || 0));
    });
    return Array.from(map.entries()).slice(0, 4).map(([label, value]) => ({
      label,
      value: value.toLocaleString('id-ID'),
    }));
  }, [quotaStats]);

  const segments = useMemo(() => {
    const map = new Map<string, number>();
    quotaStats.forEach((c) => {
      map.set(c.kategori, (map.get(c.kategori) ?? 0) + Number(c.terjual || 0));
    });
    const entries = Array.from(map.entries());
    const sold = entries.reduce((sum, [, v]) => sum + v, 0);
    if (sold === 0) return [];
    return entries.map(([label, value], idx) => ({
      label,
      pct: Math.max((value / sold) * 100, 2),
      color: SEGMENT_COLORS[idx % SEGMENT_COLORS.length],
    }));
  }, [quotaStats]);

  const concertSales = useMemo(() => {
    const map = new Map<string, { sold: number; quota: number }>();
    quotaStats.forEach((c) => {
      const current = map.get(c.event_title) ?? { sold: 0, quota: 0 };
      current.sold += Number(c.terjual || 0);
      current.quota += Number(c.quota || 0);
      map.set(c.event_title, current);
    });
    return Array.from(map.entries()).map(([name, v]) => {
      const event = events.find((e) => e.title === name);
      const pct = v.quota > 0 ? Math.round((v.sold / v.quota) * 100) : 0;
      return {
        name,
        sold: v.sold,
        quota: v.quota,
        pct,
        open: event ? event.status === 'open' : true,
      };
    }).slice(0, 5);
  }, [quotaStats, events]);

  const upcoming = useMemo(() => {
    return [...events]
      .sort((a, b) => dayjs(a.event_date).valueOf() - dayjs(b.event_date).valueOf())
      .slice(0, 4);
  }, [events]);

  const pendingOrders = dashboard?.order_stats.find((s) => s.payment_status === 'pending')?.total ?? 0;
  const recentOrders = orders.slice(0, 6);

  const STATS = [
    {
      label: 'Total Events',
      value: String(summary?.total_event ?? events.length),
      sub: `${summary?.event_open ?? 0} currently on sale`,
      icon: <CalendarIcon />,
    },
    {
      label: 'Total Tickets Sold',
      value: totalSold.toLocaleString('id-ID'),
      sub: `of ${totalQuota.toLocaleString('id-ID')} total quota`,
      icon: <TicketIcon />,
    },
    {
      label: 'Total Orders',
      value: String(orders.length),
      sub: `${pendingOrders} awaiting payment`,
      icon: <ReceiptIcon />,
    },
    {
      label: 'Ticket Sales Status',
      value: `${summary?.event_open ?? 0} Open`,
      sub: `${summary?.event_closed ?? 0} closed`,
      icon: <RadioIcon />,
    },
  ];

  return (
    <div className="cadmin-page">
      {/* ---- Kartu statistik ---- */}
      <div className="cadmin-stats">
        {STATS.map((s) => (
          <div className="cadmin-card cadmin-stat" key={s.label}>
            <div className="cadmin-stat-head">
              <span className="cadmin-stat-label">{s.label}</span>
              <span className="cadmin-stat-icon">{s.icon}</span>
            </div>
            <div className="cadmin-stat-value">{loading ? '—' : s.value}</div>
            <div className="cadmin-stat-sub">{loading ? 'Memuat data...' : s.sub}</div>
          </div>
        ))}
      </div>

      {/* ---- Overview + Upcoming ---- */}
      <div className="cadmin-grid-mid">
        {/* Ticket Sales Overview */}
        <section className="cadmin-card">
          <div className="cadmin-card-head">
            <div>
              <h3 className="cadmin-card-title">Ticket Sales Overview</h3>
              <p className="cadmin-card-sub">Quota usage across all concerts</p>
            </div>
          </div>

          <div className="cadmin-ov-top">
            <div>
              <div className="cadmin-ov-big">{soldPct}%</div>
              <div className="cadmin-ov-note">
                {totalSold.toLocaleString('id-ID')} sold &middot; {remaining.toLocaleString('id-ID')} remaining
              </div>
            </div>
            <div className="cadmin-ov-legend">
              {categoryLegend.length === 0 ? (
                <div className="cadmin-ov-legend-item" style={{ paddingLeft: 0, borderLeft: 'none' }}>
                  <div className="cadmin-ov-legend-value">0</div>
                  <div className="cadmin-ov-legend-label">No categories yet</div>
                </div>
              ) : (
                categoryLegend.map((c) => (
                  <div className="cadmin-ov-legend-item" key={c.label}>
                    <div className="cadmin-ov-legend-value">{c.value}</div>
                    <div className="cadmin-ov-legend-label">{c.label}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bar kuota segmented */}
          <div className="cadmin-segbar">
            {segments.length === 0 ? (
              <div style={{ width: '100%', backgroundColor: '#334155' }} />
            ) : (
              segments.map((seg) => (
                <div
                  key={seg.label}
                  title={`${seg.label} — ${Math.round(seg.pct)}% dari tiket terjual`}
                  style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                />
              ))
            )}
          </div>

          {/* Daftar progres per konser */}
          {concertSales.length === 0 ? (
            <div className="cadmin-mini-empty">
              <div className="cadmin-mini-empty-title">Belum ada penjualan tiket</div>
              <div className="cadmin-mini-empty-text">
                Tambahkan konser dan kategori tiket untuk mulai melacak penjualan.
              </div>
            </div>
          ) : (
            <div className="cadmin-ov-list">
              {concertSales.map((c) => (
                <div className="cadmin-ov-row" key={c.name}>
                  <div className="cadmin-ov-info">
                    <div className="cadmin-ov-name">{c.name}</div>
                    <div className="cadmin-ov-count">
                      {c.sold.toLocaleString('id-ID')} / {c.quota.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="cadmin-bar">
                    <span
                      style={{
                        width: `${c.pct}%`,
                        backgroundColor: c.pct >= 90 ? '#f59e0b' : '#3b82f6',
                      }}
                    />
                  </div>
                  <div className="cadmin-ov-pct">{c.pct}%</div>
                  <span className={pillClass(c.open ? 'paid' : 'closed')}>
                    {c.open ? 'Sales Open' : 'Sales Closed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Concerts */}
        <section className="cadmin-card">
          <div className="cadmin-card-head">
            <div>
              <h3 className="cadmin-card-title">Upcoming Concerts</h3>
            </div>
            <Link to="/events" className="cadmin-viewall">View all</Link>
          </div>

          {loading ? (
            <div className="cadmin-loading" style={{ padding: 24 }}>Memuat...</div>
          ) : upcoming.length === 0 ? (
            <div className="cadmin-mini-empty">
              <div className="cadmin-mini-empty-title">Belum ada konser</div>
              <div className="cadmin-mini-empty-text">
                Konser yang Anda tambahkan akan tampil di sini.
              </div>
            </div>
          ) : (
            <div className="cadmin-up-list">
              {upcoming.map((c) => (
                <div className="cadmin-up-row" key={c.id}>
                  <img
                    className="cadmin-up-thumb"
                    src={imgUrl(c.poster)}
                    alt={c.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = placeholder(c.title.slice(0, 1).toUpperCase()); }}
                  />
                  <div className="cadmin-up-info">
                    <div className="cadmin-up-name">{c.title}</div>
                    <div className="cadmin-up-artist">{c.artist_name || '-'}</div>
                    <div className="cadmin-up-date">{dayjs(c.event_date).format('DD MMM YYYY')}</div>
                  </div>
                  <span className={pillClass(c.status === 'open' ? 'paid' : 'closed')}>
                    {c.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---- Recent Orders ---- */}
      <section className="cadmin-card">
        <div className="cadmin-card-head">
          <div>
            <h3 className="cadmin-card-title">Recent Orders</h3>
          </div>
          <Link to="/orders" className="cadmin-viewall">View all</Link>
        </div>

        {loading ? (
          <div className="cadmin-loading" style={{ padding: 24 }}>Memuat...</div>
        ) : recentOrders.length === 0 ? (
          <div className="cadmin-mini-empty">
            <div className="cadmin-mini-empty-title">Belum ada pesanan</div>
            <div className="cadmin-mini-empty-text">
              Pesanan terbaru dari pelanggan akan muncul di sini.
            </div>
          </div>
        ) : (
          <div className="cadmin-table-wrap">
            <table className="cadmin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Concert</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="cadmin-order-id">{orderIdLabel(o.id)}</td>
                    <td>{o.customer_name || '-'}</td>
                    <td>{o.event_title || '-'}</td>
                    <td>{o.category || '-'}</td>
                    <td>{o.qty ?? '-'}</td>
                    <td>
                      <span className={pillClass(o.payment_status)}>
                        {STATUS_LABEL[o.payment_status] ?? o.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{dashStyles}</style>
    </div>
  );
}

/* =============================================================
   STYLING — semua class memakai prefix "cadmin-"
   ============================================================= */

const dashStyles = `
.cadmin-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---------- Kartu dasar ---------- */
.cadmin-card {
  background-color: #16233a;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 20px 22px;
  box-sizing: border-box;
  min-width: 0;
}

.cadmin-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.cadmin-card-title {
  font-size: 15.5px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.cadmin-card-sub {
  font-size: 12.5px;
  color: #94a3b8;
  margin: 3px 0 0;
}

.cadmin-viewall {
  font-size: 13px;
  font-weight: 700;
  color: #3b82f6;
  text-decoration: none;
  flex-shrink: 0;
}
.cadmin-viewall:hover { color: #93c5fd; }

.cadmin-loading { padding: 24px; text-align: center; color: #94a3b8; font-size: 13.5px; }

.cadmin-mini-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; padding: 26px 16px; text-align: center;
  border: 1px dashed rgba(148, 163, 184, 0.18);
  border-radius: 10px;
}
.cadmin-mini-empty-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.cadmin-mini-empty-text { font-size: 12px; color: #94a3b8; line-height: 1.5; }

/* ---------- Statistik ---------- */
.cadmin-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.cadmin-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cadmin-stat-label {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
}

.cadmin-stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background-color: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cadmin-stat-value {
  font-size: 30px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin-top: 16px;
}

.cadmin-stat-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 5px;
}

/* ---------- Grid tengah ---------- */
.cadmin-grid-mid {
  display: grid;
  grid-template-columns: 1.9fr 1fr;
  gap: 20px;
  align-items: stretch;
}

/* Overview */
.cadmin-ov-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}

.cadmin-ov-big {
  font-size: 44px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -1.5px;
  line-height: 1;
}

.cadmin-ov-note {
  font-size: 12.5px;
  color: #94a3b8;
  margin-top: 8px;
}

.cadmin-ov-legend {
  display: flex;
  gap: 28px;
}

.cadmin-ov-legend-item {
  padding-left: 28px;
  border-left: 1px solid rgba(148, 163, 184, 0.10);
}

.cadmin-ov-legend-value {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
}

.cadmin-ov-legend-label {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
}

.cadmin-segbar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  margin: 20px 0 18px;
}

/* Daftar progres konser */
.cadmin-ov-list {
  display: flex;
  flex-direction: column;
}

.cadmin-ov-row {
  display: grid;
  grid-template-columns: 230px 1fr 44px auto;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
}

.cadmin-ov-info { min-width: 0; }

.cadmin-ov-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cadmin-ov-count {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.cadmin-bar {
  height: 7px;
  border-radius: 999px;
  background-color: rgba(148, 163, 184, 0.10);
  overflow: hidden;
}

.cadmin-bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.cadmin-ov-pct {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  text-align: right;
}

/* ---------- Upcoming concerts ---------- */
.cadmin-up-list {
  display: flex;
  flex-direction: column;
}

.cadmin-up-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 0;
}

.cadmin-up-thumb {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
  background-color: #0e1828;
}

.cadmin-up-info { flex: 1; min-width: 0; }

.cadmin-up-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cadmin-up-artist {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.cadmin-up-date {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
}

/* ---------- Tabel orders ---------- */
.cadmin-table-wrap { overflow-x: auto; }

.cadmin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

.cadmin-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
  white-space: nowrap;
}

.cadmin-table td {
  font-size: 13.5px;
  color: #e2e8f0;
  padding: 13px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.07);
  white-space: nowrap;
}

.cadmin-table tbody tr { transition: background-color 0.15s ease; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }

.cadmin-order-id {
  color: #3b82f6 !important;
  font-weight: 700;
  font-size: 13px !important;
}

/* ---------- Pills status ---------- */
.cadmin-pill {
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 11px;
  border-radius: 999px;
  white-space: nowrap;
}
.cadmin-pill::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  margin-right: 6px;
}

.cadmin-pill.open {
  background-color: rgba(34, 197, 94, 0.16);
  color: #4ade80;
}

.cadmin-pill.pending {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.cadmin-pill.rejected {
  background-color: rgba(239, 68, 68, 0.14);
  color: #ef4444;
}

.cadmin-pill.closed {
  background-color: rgba(148, 163, 184, 0.14);
  color: #94a3b8;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .cadmin-stats { grid-template-columns: repeat(2, 1fr); }
  .cadmin-grid-mid { grid-template-columns: 1fr; }
  .cadmin-ov-row { grid-template-columns: 180px 1fr 44px auto; }
}

@media (max-width: 640px) {
  .cadmin-stats { grid-template-columns: 1fr; }
  .cadmin-ov-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'info pct'
      'bar pill';
    row-gap: 8px;
  }
  .cadmin-ov-info { grid-area: info; }
  .cadmin-bar { grid-area: bar; }
  .cadmin-ov-pct { grid-area: pct; }
  .cadmin-ov-row .cadmin-pill { grid-area: pill; }
  .cadmin-ov-legend { gap: 16px; }
  .cadmin-ov-legend-item { padding-left: 14px; }
}
`;
