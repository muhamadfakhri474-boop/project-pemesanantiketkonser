import { useEffect, useMemo, useState } from 'react';
import { orderService, eventService } from '../../api/services';
import dayjs from 'dayjs';
import { AdminModal, UiStyles } from '../../components/AdminUI';
import { useRealtime } from '../../hooks/useRealtime';

/* ---------- Ikon garis ---------- */
function Ic({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const EyeIcon = () => (<Ic><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Ic>);
const SearchIcon = () => (<Ic><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>);
const ReceiptIcon = () => (
  <Ic size={26}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Ic>
);

/* ---------- Tipe & helper ---------- */
interface OrderItem {
  id: number; quantity: number; price: number; subtotal: number; category_name: string;
}
interface Order {
  id: number; user_id: number; event_id: number;
  customer_name?: string; customer_email?: string; event_title?: string;
  total_price: number; payment_status: string; order_date: string;
  category?: string | null; qty?: number | null;
}
interface OrderDetail extends Order {
  venue?: string; city?: string; event_date?: string;
  payment_method?: string | null; transaction_id?: string | null;
  payment_verify_status?: string | null; verified_at?: string | null;
  items?: OrderItem[];
}

const PILL_CLASS: Record<string, string> = {
  pending: 'pending',
  paid: 'paid',
  rejected: 'rejected',
  cancelled: 'gray',
  failed: 'rejected',
  expired: 'gray',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  failed: 'Failed',
  expired: 'Expired',
};
const VERIFY_LABEL: Record<string, string> = {
  pending: 'Pending',
  verified: 'Approved',
  rejected: 'Rejected',
};

const orderIdLabel = (id: number) => `ORD-${String(id).padStart(5, '0')}`;
const PAGE_SIZE = 8;
const rupiah = (v: number | string | null | undefined) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;

const styles = `
.cadmin-page { display: flex; flex-direction: column; gap: 18px; }
.cadmin-card {
  background-color: #111c2e;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 20px 22px;
  box-sizing: border-box;
  min-width: 0;
}
.cadmin-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cadmin-h1 { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0; }
.cadmin-sub { font-size: 13px; color: #94a3b8; margin: 5px 0 0; }
.cadmin-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cadmin-search { position: relative; }
.cadmin-search svg { position: absolute; left: 11px; top: 12px; color: #94a3b8; pointer-events: none; }
.cadmin-input, .cadmin-select {
  height: 40px; background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 9px; color: #e2e8f0;
  font-family: inherit; font-size: 13px; padding: 0 12px;
  box-sizing: border-box; outline: none;
  transition: border-color 0.15s ease;
}
.cadmin-input:focus, .cadmin-select:focus { border-color: rgba(59, 130, 246, 0.45); }
.cadmin-search .cadmin-input { padding-left: 34px; min-width: 250px; }
.cadmin-select { min-width: 160px; cursor: pointer; }
.cadmin-table-wrap { overflow-x: auto; }
.cadmin-table { width: 100%; border-collapse: collapse; min-width: 980px; }
.cadmin-table th {
  text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8;
  padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); white-space: nowrap;
}
.cadmin-table td { font-size: 13px; color: #e2e8f0; padding: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.07); vertical-align: middle; }
.cadmin-table tbody tr { transition: background-color 0.15s ease; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }
.cadmin-order-id { color: #3b82f6; font-weight: 700; font-size: 12.5px; }
.cadmin-cust-name { font-weight: 600; color: #ffffff; font-size: 13px; }
.cadmin-cust-mail { font-size: 11.5px; color: #94a3b8; margin-top: 3px; }
.cadmin-pill {
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; white-space: nowrap;
}
.cadmin-pill::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background-color: currentColor; margin-right: 6px;
}
.cadmin-pill.pending { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.cadmin-pill.paid { background-color: rgba(34, 197, 94, 0.16); color: #22c55e; }
.cadmin-pill.rejected { background-color: rgba(239, 68, 68, 0.14); color: #ef4444; }
.cadmin-pill.gray { background-color: rgba(148, 163, 184, 0.14); color: #94a3b8; }
.cadmin-actions { display: flex; gap: 2px; justify-content: flex-end; }
.cadmin-icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; color: #94a3b8;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-icon-btn:hover { background-color: rgba(148, 163, 184, 0.10); color: #ffffff; }
.cadmin-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 4px; }
.cadmin-foot-text { font-size: 12.5px; color: #94a3b8; }
.cadmin-pager { display: flex; align-items: center; gap: 6px; }
.cadmin-pg-btn {
  min-width: 30px; height: 30px; padding: 0 6px; border-radius: 8px;
  border: none; background: transparent; color: #94a3b8;
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-pg-btn:hover:not(:disabled):not(.active) { background-color: rgba(148, 163, 184, 0.12); color: #ffffff; }
.cadmin-pg-btn.active { background-color: #3b82f6; color: #ffffff; }
.cadmin-pg-btn:disabled { opacity: 0.35; cursor: default; }
.cadmin-loading { padding: 32px; text-align: center; color: #94a3b8; font-size: 13.5px; }
.cadmin-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 52px 16px; text-align: center;
}
.cadmin-empty-icon {
  width: 54px; height: 54px; border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.12); color: #60a5fa;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 8px;
}
.cadmin-empty-title { font-size: 14px; font-weight: 700; color: #e2e8f0; }
.cadmin-empty-text { font-size: 12.5px; color: #94a3b8; }
.cadmin-detail-total-label { font-size: 12.5px; color: #94a3b8; }
.cadmin-detail-total { font-size: 32px; font-weight: 800; color: #f8fafc; letter-spacing: -0.6px; margin-top: 4px; }

@media (max-width: 720px) {
  .cadmin-search .cadmin-input { min-width: 0; width: 100%; }
  .cadmin-search { width: 100%; }
}
`;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [concertFilter, setConcertFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  /* Modal detail */
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    orderService.getAll()
      .then((d) => setOrders(d?.data || d?.orders || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    eventService.getAll()
      .then((d) => setEvents(d?.data || d?.events || d || []))
      .catch(() => {});
  }, []);

  // Real-time listener: refresh order saat ada perubahan
  useRealtime('orders:changed', () => {
    orderService.getAll()
      .then((d) => setOrders(d?.data || d?.orders || d || []))
      .catch(() => {});
  }, [orders.length]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchQ = !q || o.customer_name?.toLowerCase().includes(q) || orderIdLabel(o.id).toLowerCase().includes(q);
      const matchE = !concertFilter || String(o.event_id) === concertFilter;
      const matchS = !statusFilter || o.payment_status === statusFilter;
      return matchQ && matchE && matchS;
    });
  }, [orders, search, concertFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const rows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const openDetail = (o: Order) => {
    setDetail(o);
    setDetailLoading(true);
    orderService.getById(o.id)
      .then((d) => setDetail(d))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const items = detail?.items ?? [];
  const categoryLabel = detail?.category
    || (items.length > 0 ? Array.from(new Set(items.map((it) => it.category_name))).join(', ') : '-');
  const qtyLabel = detail?.qty ?? (items.length > 0 ? items.reduce((sum, it) => sum + Number(it.quantity || 0), 0) : '-');

  return (
    <div className="cadmin-page">
      <style>{styles}</style>
      <UiStyles />

      {/* Header */}
      <div className="cadmin-head">
        <div>
          <h1 className="cadmin-h1">Pesanan</h1>
          <p className="cadmin-sub">Review and track all customer orders.</p>
        </div>
      </div>

      <div className="cadmin-card">
        <div className="cadmin-toolbar" style={{ marginBottom: 16 }}>
          <div className="cadmin-search">
            <SearchIcon />
            <input
              className="cadmin-input"
              placeholder="Search order ID or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="cadmin-select" value={concertFilter} onChange={(e) => { setConcertFilter(e.target.value); setPage(1); }}>
            <option value="">All concerts</option>
            {events.map((ev) => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
          </select>
          <select className="cadmin-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="cadmin-loading">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="cadmin-empty">
            <div className="cadmin-empty-icon"><ReceiptIcon /></div>
            <div className="cadmin-empty-title">
              {search || concertFilter || statusFilter ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan'}
            </div>
            <div className="cadmin-empty-text">
              {search || concertFilter || statusFilter
                ? 'Coba ubah kata kunci atau filter yang digunakan.'
                : 'Pesanan dari aplikasi pelanggan akan muncul di sini.'}
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
                  <th>Total Price</th>
                  <th>Order Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="cadmin-order-id">{orderIdLabel(o.id)}</td>
                    <td>
                      <div className="cadmin-cust-name">{o.customer_name || '-'}</div>
                      <div className="cadmin-cust-mail">{o.customer_email || ''}</div>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{o.event_title || '-'}</td>
                    <td style={{ color: '#e2e8f0' }}>{o.category || '-'}</td>
                    <td style={{ color: '#e2e8f0' }}>{o.qty ?? '-'}</td>
                    <td style={{ fontWeight: 600 }}>{rupiah(o.total_price)}</td>
                    <td style={{ color: '#94a3b8' }}>{dayjs(o.order_date).format('DD MMM YYYY')}</td>
                    <td>
                      <span className={`cadmin-pill ${PILL_CLASS[o.payment_status] ?? 'gray'}`}>
                        {STATUS_LABEL[o.payment_status] ?? o.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cadmin-actions">
                        <button className="cadmin-icon-btn" title="Lihat detail" onClick={() => openDetail(o)}><EyeIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="cadmin-foot" style={{ marginTop: 14 }}>
          <span className="cadmin-foot-text">
            Showing {rows.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1}-{(pageSafe - 1) * PAGE_SIZE + rows.length} of {filtered.length}
          </span>
          <div className="cadmin-pager">
            <button className="cadmin-pg-btn" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>&lsaquo;</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} className={`cadmin-pg-btn${n === pageSafe ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className="cadmin-pg-btn" disabled={pageSafe >= totalPages} onClick={() => setPage(pageSafe + 1)}>&rsaquo;</button>
          </div>
        </div>
      </div>

      {/* Modal detail */}
      {detail ? (
        <AdminModal
          title={`Order ${orderIdLabel(detail.id)}`}
          subtitle={`Placed on ${dayjs(detail.order_date).format('DD MMM YYYY')} · ${dayjs(detail.order_date).format('HH:mm')} via mobile app`}
          onClose={() => setDetail(null)}
          maxWidth={620}
          footer={
            <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={() => setDetail(null)}>
              Close
            </button>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="cadmin-detail-total-label">Total amount</div>
              <div className="cadmin-detail-total">{rupiah(detail.total_price)}</div>
            </div>
            <span className={`cadmin-ui-pill ${PILL_CLASS[detail.payment_status] ?? 'gray'}`}>
              {STATUS_LABEL[detail.payment_status] ?? detail.payment_status}
            </span>
          </div>

          <div className="cadmin-ui-section">
            <p className="cadmin-ui-section-label">Customer</p>
            <div className="cadmin-ui-box">
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Name</div>
                  <div className="cadmin-ui-cell-value">{detail.customer_name || '-'}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Email</div>
                  <div className="cadmin-ui-cell-value">{detail.customer_email || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cadmin-ui-section">
            <p className="cadmin-ui-section-label">Order</p>
            <div className="cadmin-ui-box">
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Concert</div>
                  <div className="cadmin-ui-cell-value">{detail.event_title || '-'}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Ticket Category</div>
                  <div className="cadmin-ui-cell-value">{categoryLabel}</div>
                </div>
              </div>
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Quantity</div>
                  <div className="cadmin-ui-cell-value">{qtyLabel}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Event Date</div>
                  <div className="cadmin-ui-cell-value">
                    {detail.event_date ? dayjs(detail.event_date).format('DD MMM YYYY') : '-'}
                  </div>
                </div>
              </div>
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Venue</div>
                  <div className="cadmin-ui-cell-value">{detail.venue || '-'}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">City</div>
                  <div className="cadmin-ui-cell-value">{detail.city || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="cadmin-ui-section">
            <p className="cadmin-ui-section-label">Payment</p>
            <div className="cadmin-ui-box">
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Method</div>
                  <div className="cadmin-ui-cell-value">{detail.payment_method || '-'}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Verification</div>
                  <div className="cadmin-ui-cell-value">
                    {detailLoading ? '...' : (
                      detail.payment_verify_status ? (
                        <span className={`cadmin-ui-pill ${
                          detail.payment_verify_status === 'verified'
                            ? 'approved'
                            : detail.payment_verify_status === 'rejected'
                              ? 'rejected'
                              : 'pending'
                        }`}>
                          {VERIFY_LABEL[detail.payment_verify_status] ?? detail.payment_verify_status}
                        </span>
                      ) : '-'
                    )}
                  </div>
                </div>
              </div>
              <div className="cadmin-ui-box-row">
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Transaction ID</div>
                  <div className="cadmin-ui-cell-value">{detail.transaction_id || '-'}</div>
                </div>
                <div className="cadmin-ui-cell">
                  <div className="cadmin-ui-cell-label">Verified At</div>
                  <div className="cadmin-ui-cell-value">
                    {detail.verified_at ? dayjs(detail.verified_at).format('DD MMM YYYY · HH:mm') : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </div>
  );
}
