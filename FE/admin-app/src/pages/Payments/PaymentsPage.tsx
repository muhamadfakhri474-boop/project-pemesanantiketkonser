import { useEffect, useMemo, useState } from 'react';
import { paymentService, eventService } from '../../api/services';
import dayjs from 'dayjs';
import {
  AdminModal,
  AdminToast,
  ConfirmDialog,
  UiStyles,
  CheckIcon,
  AlertIcon,
  useAdminToast,
} from '../../components/AdminUI';
import { useRealtime } from '../../hooks/useRealtime';

/* ---------- Ikon garis ---------- */
function Ic({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const SearchIcon = () => (<Ic><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>);
const ProofIcon = () => (<Ic size={14}><path d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="1" width="6" height="4" rx="1" /></Ic>);
const CheckSmallIcon = () => (<Ic size={14}><path d="M20 6 9 17l-5-5" /></Ic>);
const XSmallIcon = () => (<Ic size={14}><path d="M18 6 6 18M6 6l12 12" /></Ic>);
const ReceiptIcon = () => (
  <Ic size={30}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Ic>
);

/* ---------- Tipe & helper ---------- */
interface Payment {
  id: number; order_id: number; payment_method?: string; transaction_id?: string;
  transaction_status?: string; status: string; verified_at?: string | null;
  payment_proof?: string | null;
  total_price: number; order_status: string; order_date: string;
  customer_name?: string; customer_email?: string; event_title?: string;
  event_id?: number;
}

const API_ORIGIN = 'http://localhost:3000';
const imgUrl = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ORIGIN}/${path.replace(/\\/g, '/')}`;
};

const orderIdLabel = (id: number) => `ORD-${String(id).padStart(5, '0')}`;
const rupiah = (v: number | string | null | undefined) => `Rp ${Number(v ?? 0).toLocaleString('id-ID')}`;
const PAGE_SIZE = 8;

const styles = `
.cadmin-page { display: flex; flex-direction: column; gap: 18px; }
.cadmin-h1 { font-size: 22px; font-weight: 800; color: #f8fafc; margin: 0; letter-spacing: -0.2px; }
.cadmin-sub { font-size: 13px; color: #94a3b8; margin: 5px 0 0; }
.cadmin-card {
  background-color: #111c2e;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 20px 22px;
  box-sizing: border-box;
  min-width: 0;
}
.cadmin-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.cadmin-stat-label { font-size: 12.5px; color: #94a3b8; }
.cadmin-stat-value { font-size: 30px; font-weight: 800; margin-top: 10px; letter-spacing: -0.5px; }
.cadmin-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.cadmin-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cadmin-tabs {
  display: inline-flex; gap: 4px; padding: 4px;
  background-color: #0e1828; border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 10px;
}
.cadmin-tab {
  height: 32px; padding: 0 14px; border: none; border-radius: 7px;
  background: transparent; color: #94a3b8;
  font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-tab:hover:not(.active) { color: #f8fafc; }
.cadmin-tab.active { background-color: #334155; color: #f8fafc; }
.cadmin-tab .count { font-size: 11px; opacity: 0.75; }
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
.cadmin-search .cadmin-input { padding-left: 34px; min-width: 230px; }
.cadmin-select { min-width: 160px; cursor: pointer; }
.cadmin-table-wrap { overflow-x: auto; }
.cadmin-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
.cadmin-table th {
  text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8;
  padding: 10px 11px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); white-space: nowrap;
}
.cadmin-table td { font-size: 13px; color: #e2e8f0; padding: 12px 11px; border-bottom: 1px solid rgba(148, 163, 184, 0.07); vertical-align: middle; white-space: nowrap; }
.cadmin-table tbody tr { transition: background-color 0.15s ease; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }
.cadmin-order-id { color: #3b82f6; font-weight: 700; font-size: 12.5px; }
.cadmin-cust-name { font-weight: 600; color: #ffffff; font-size: 13px; }
.cadmin-pill {
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; white-space: nowrap;
}
.cadmin-pill::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background-color: currentColor; margin-right: 6px;
}
.cadmin-pill.pending { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.cadmin-pill.approved { background-color: rgba(34, 197, 94, 0.16); color: #22c55e; }
.cadmin-pill.rejected { background-color: rgba(239, 68, 68, 0.14); color: #ef4444; }
.cadmin-actions { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
.cadmin-btn-sm {
  height: 30px; padding: 0 10px; border-radius: 8px; border: none;
  font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 5px;
  transition: filter 0.15s ease, background-color 0.15s ease;
}
.cadmin-btn-sm:disabled { opacity: 0.6; cursor: default; }
.cadmin-btn-proof { background-color: rgba(148, 163, 184, 0.12); color: #e2e8f0; width: auto; padding: 0 10px; justify-content: center; gap: 6px; }
.cadmin-btn-proof:hover { background-color: rgba(148, 163, 184, 0.20); color: #ffffff; }
.cadmin-btn-approve { background-color: #22c55e; color: #ffffff; }
.cadmin-btn-approve:hover { filter: brightness(1.08); }
.cadmin-btn-reject { background-color: #334155; color: #f8fafc; }
.cadmin-btn-reject:hover { background-color: #475569; }
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

.cadmin-clip { max-width: 175px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cadmin-clip-sm { max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Modal bukti pembayaran */
.cadmin-proof-grid { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 20px; align-items: start; }
.cadmin-receipt {
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 16px;
}
.cadmin-receipt-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.cadmin-receipt-title { font-size: 12px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #94a3b8; }
.cadmin-receipt-badge {
  font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
  background-color: rgba(59, 130, 246, 0.16); color: #93c5fd;
}
.cadmin-receipt-img {
  display: block; width: 100%; max-height: 330px; object-fit: contain;
  border-radius: 9px; background-color: #0b1120;
}
.cadmin-receipt-ph {
  min-height: 250px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  border: 1px dashed rgba(148, 163, 184, 0.24); border-radius: 10px;
  color: #64748b; text-align: center; padding: 18px;
}
.cadmin-receipt-ph-title { font-size: 13px; font-weight: 600; color: #cbd5e1; }
.cadmin-receipt-ph-text { font-size: 11.5px; color: #64748b; }
.cadmin-receipt-amount { font-size: 24px; font-weight: 800; color: #f8fafc; margin-top: 14px; letter-spacing: -0.4px; }
.cadmin-receipt-amount-label { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }
.cadmin-receipt-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 9px 0; border-top: 1px solid rgba(148, 163, 184, 0.12); margin-top: 10px;
  font-size: 12px;
}
.cadmin-receipt-row-label { color: #94a3b8; }
.cadmin-receipt-row-value { color: #e2e8f0; font-weight: 600; text-align: right; word-break: break-word; }
.cadmin-verify-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.cadmin-verify-label { font-size: 12.5px; font-weight: 600; color: #94a3b8; }

@media (max-width: 1000px) { .cadmin-stats { grid-template-columns: 1fr; } }
@media (max-width: 820px) { .cadmin-proof-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) {
  .cadmin-search .cadmin-input { min-width: 0; width: 100%; }
  .cadmin-search { width: 100%; }
}
`;

type TabKey = 'all' | 'pending' | 'verified' | 'rejected';
type ConfirmAction = { payment: Payment; action: 'verify' | 'reject' };

const statusPill = (p: Payment) => {
  if (p.status === 'verified') return { cls: 'approved', label: 'Approved' };
  if (p.status === 'rejected') return { cls: 'rejected', label: 'Rejected' };
  return { cls: 'pending', label: 'Pending' };
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<{ id: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [concertFilter, setConcertFilter] = useState('');
  const [page, setPage] = useState(1);

  /* Modal proof + konfirmasi */
  const [proof, setProof] = useState<Payment | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [processing, setProcessing] = useState(false);

  const { toast, showToast, clearToast } = useAdminToast();

  const fetchPayments = () => {
    paymentService.getAll()
      .then((d) => setPayments(d?.data || d?.payments || d || []))
      .catch(() => showToast('Gagal memuat data pembayaran', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
    eventService.getAll()
      .then((d) => setEvents(d?.data || d?.events || d || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time listener: refresh payment saat ada perubahan
  useRealtime('payments:changed', fetchPayments, [payments.length]);

  const counts = useMemo(() => ({
    all: payments.length,
    pending: payments.filter((p) => p.status === 'pending').length,
    verified: payments.filter((p) => p.status === 'verified').length,
    rejected: payments.filter((p) => p.status === 'rejected').length,
  }), [payments]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'verified', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      const matchTab = tab === 'all' || p.status === tab;
      const matchQ = !q || p.customer_name?.toLowerCase().includes(q) || orderIdLabel(p.order_id).toLowerCase().includes(q);
      const matchE = !concertFilter || p.event_title === events.find((e) => String(e.id) === concertFilter)?.title;
      return matchTab && matchQ && matchE;
    });
  }, [payments, tab, search, concertFilter, events]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const rows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const askAction = (payment: Payment, action: 'verify' | 'reject') => {
    setConfirmAction({ payment, action });
  };

  const runAction = async () => {
    if (!confirmAction) return;
    const { payment, action } = confirmAction;
    setProcessing(true);
    try {
      if (action === 'verify') await paymentService.verify(payment.id);
      else await paymentService.reject(payment.id);

      setConfirmAction(null);
      setProof(null);
      showToast(action === 'verify' ? 'Pembayaran berhasil disetujui' : 'Pembayaran berhasil ditolak');
      fetchPayments();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Gagal memproses pembayaran', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="cadmin-page">
      <style>{styles}</style>
      <UiStyles />

      {/* Header + kartu statistik */}
      <div className="cadmin-head">
        <div>
          <h2 className="cadmin-h1">Verifikasi Pembayaran</h2>
          <p className="cadmin-sub">Tinjau dan verifikasi bukti pembayaran dari pesanan pelanggan.</p>
        </div>
      </div>

      <div className="cadmin-stats">
        <div className="cadmin-card">
          <div className="cadmin-stat-label">Awaiting verification</div>
          <div className="cadmin-stat-value" style={{ color: '#f59e0b' }}>{counts.pending}</div>
        </div>
        <div className="cadmin-card">
          <div className="cadmin-stat-label">Approved payments</div>
          <div className="cadmin-stat-value" style={{ color: '#22c55e' }}>{counts.verified}</div>
        </div>
        <div className="cadmin-card">
          <div className="cadmin-stat-label">Rejected payments</div>
          <div className="cadmin-stat-value" style={{ color: '#ef4444' }}>{counts.rejected}</div>
        </div>
      </div>

      {/* Tabel */}
      <div className="cadmin-card">
        <div className="cadmin-toolbar" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
          <div className="cadmin-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`cadmin-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => { setTab(t.key); setPage(1); }}
              >
                {t.label} <span className="count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <div className="cadmin-toolbar">
            <div className="cadmin-search">
              <SearchIcon />
              <input
                className="cadmin-input"
                placeholder="Search order or customer..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="cadmin-select" value={concertFilter} onChange={(e) => { setConcertFilter(e.target.value); setPage(1); }}>
              <option value="">All concerts</option>
              {events.map((ev) => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="cadmin-loading">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="cadmin-empty">
            <div className="cadmin-empty-icon"><ReceiptIcon /></div>
            <div className="cadmin-empty-title">Belum ada pembayaran</div>
            <div className="cadmin-empty-text">
              Bukti pembayaran dari pelanggan akan muncul di sini untuk diverifikasi.
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
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const pill = statusPill(p);
                  return (
                    <tr key={p.id}>
                      <td className="cadmin-order-id">{orderIdLabel(p.order_id)}</td>
                      <td>
                        <div className="cadmin-cust-name">{p.customer_name || '-'}</div>
                      </td>
                      <td style={{ color: '#94a3b8' }}><div className="cadmin-clip">{p.event_title || '-'}</div></td>
                      <td style={{ fontWeight: 600 }}>{rupiah(p.total_price)}</td>
                      <td style={{ color: '#94a3b8' }}><div className="cadmin-clip-sm">{p.payment_method || '-'}</div></td>
                      <td style={{ color: '#94a3b8' }}>
                        {dayjs(p.verified_at || p.order_date).format('DD MMM YYYY')}
                      </td>
                      <td>
                        <span className={`cadmin-pill ${pill.cls}`}>{pill.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="cadmin-actions">
                          <button className="cadmin-btn-sm cadmin-btn-proof" title="Lihat bukti & detail transaksi" onClick={() => setProof(p)}>
                            <ProofIcon /> Proof
                          </button>
                          {p.status === 'pending' && (
                            <>
                              <button
                                className="cadmin-btn-sm cadmin-btn-approve"
                                onClick={() => askAction(p, 'verify')}
                              >
                                <CheckSmallIcon /> Approve
                              </button>
                              <button
                                className="cadmin-btn-sm cadmin-btn-reject"
                                onClick={() => askAction(p, 'reject')}
                              >
                                <XSmallIcon /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal bukti pembayaran */}
      {proof ? (
        <ProofModal
          payment={proof}
          onClose={() => setProof(null)}
          onApprove={() => askAction(proof, 'verify')}
          onReject={() => askAction(proof, 'reject')}
        />
      ) : null}

      {/* Konfirmasi approve / reject */}
      {confirmAction ? (
        <ConfirmDialog
          title={confirmAction.action === 'verify' ? 'Approve this payment?' : 'Reject this payment?'}
          message={
            confirmAction.action === 'verify' ? (
              <>
                Pembayaran <strong>{rupiah(confirmAction.payment.total_price)}</strong> untuk pesanan{' '}
                <strong>{orderIdLabel(confirmAction.payment.order_id)}</strong> akan disetujui dan pesanan
                ditandai sebagai <strong>Paid</strong>.
              </>
            ) : (
              <>
                Pembayaran <strong>{rupiah(confirmAction.payment.total_price)}</strong> untuk pesanan{' '}
                <strong>{orderIdLabel(confirmAction.payment.order_id)}</strong> akan ditolak. Kuota tiket akan
                dikembalikan dan kursi yang di-hold dilepas.
              </>
            )
          }
          confirmLabel={confirmAction.action === 'verify' ? 'Approve Payment' : 'Reject Payment'}
          tone={confirmAction.action === 'verify' ? 'green' : 'red'}
          icon={confirmAction.action === 'verify' ? <CheckIcon /> : <AlertIcon />}
          loading={processing}
          onConfirm={runAction}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}

      {toast ? <AdminToast message={toast.message} tone={toast.tone} onDone={clearToast} /> : null}
    </div>
  );
}

/* ============================================================
   Modal bukti pembayaran
   ============================================================ */
function ProofModal({ payment, onClose, onApprove, onReject }: {
  payment: Payment;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pill = statusPill(payment);
  const proofSrc = imgUrl(payment.payment_proof);
  const pending = payment.status === 'pending';

  return (
    <AdminModal
      title="Payment Proof"
      subtitle={`${orderIdLabel(payment.order_id)} · ${payment.customer_name || 'Customer'}`}
      onClose={onClose}
      maxWidth={880}
      footer={
        pending ? (
          <>
            <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onReject}>
              Reject Payment
            </button>
            <button className="cadmin-ui-btn cadmin-ui-btn-green" onClick={onApprove}>
              <CheckSmallIcon /> Approve Payment
            </button>
          </>
        ) : (
          <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onClose}>
            Close
          </button>
        )
      }
    >
      <div className="cadmin-proof-grid">
        {/* Bukti transfer */}
        <div className="cadmin-receipt">
          <div className="cadmin-receipt-head">
            <span className="cadmin-receipt-title">Transfer Receipt</span>
            <span className="cadmin-receipt-badge">{payment.payment_method || 'Payment'}</span>
          </div>

          {proofSrc ? (
            <img
              className="cadmin-receipt-img"
              src={proofSrc}
              alt={`Bukti pembayaran ${orderIdLabel(payment.order_id)}`}
            />
          ) : (
            <div className="cadmin-receipt-ph">
              <ReceiptIcon />
              <span className="cadmin-receipt-ph-title">No proof uploaded</span>
              <span className="cadmin-receipt-ph-text">
                Pelanggan belum mengunggah gambar bukti pembayaran.
              </span>
            </div>
          )}

          <div className="cadmin-receipt-amount">{rupiah(payment.total_price)}</div>
          <div className="cadmin-receipt-amount-label">Total transfer</div>

          <div className="cadmin-receipt-row">
            <span className="cadmin-receipt-row-label">Order</span>
            <span className="cadmin-receipt-row-value">{orderIdLabel(payment.order_id)}</span>
          </div>
          <div className="cadmin-receipt-row">
            <span className="cadmin-receipt-row-label">Transaction ID</span>
            <span className="cadmin-receipt-row-value">{payment.transaction_id || '-'}</span>
          </div>
        </div>

        {/* Verifikasi */}
        <div>
          <div className="cadmin-verify-head">
            <span className="cadmin-verify-label">Verification status</span>
            <span className={`cadmin-ui-pill ${pill.cls}`}>{pill.label}</span>
          </div>

          <div className="cadmin-ui-box">
            <div className="cadmin-ui-box-row">
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Customer</div>
                <div className="cadmin-ui-cell-value">{payment.customer_name || '-'}</div>
              </div>
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Concert</div>
                <div className="cadmin-ui-cell-value">{payment.event_title || '-'}</div>
              </div>
            </div>
            <div className="cadmin-ui-box-row">
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Amount</div>
                <div className="cadmin-ui-cell-value">{rupiah(payment.total_price)}</div>
              </div>
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Method</div>
                <div className="cadmin-ui-cell-value">{payment.payment_method || '-'}</div>
              </div>
            </div>
            <div className="cadmin-ui-box-row">
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Order Date</div>
                <div className="cadmin-ui-cell-value">{dayjs(payment.order_date).format('DD MMM YYYY · HH:mm')}</div>
              </div>
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Verified At</div>
                <div className="cadmin-ui-cell-value">
                  {payment.verified_at ? dayjs(payment.verified_at).format('DD MMM YYYY · HH:mm') : '-'}
                </div>
              </div>
            </div>
            <div className="cadmin-ui-box-row">
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Transaction ID</div>
                <div className="cadmin-ui-cell-value">{payment.transaction_id || '-'}</div>
              </div>
              <div className="cadmin-ui-cell">
                <div className="cadmin-ui-cell-label">Order Status</div>
                <div className="cadmin-ui-cell-value">{payment.order_status || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
