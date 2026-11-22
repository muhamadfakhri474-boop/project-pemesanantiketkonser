import { useEffect, useMemo, useState } from 'react';
import { ticketCategoryService, eventService } from '../../api/services';
import { useRealtime } from '../../hooks/useRealtime';import {
  AdminModal,
  AdminToast,
  ConfirmDialog,
  UiStyles,
  TrashIcon,
  useAdminToast,
} from '../../components/AdminUI';

/* ---------- Ikon garis ---------- */
function Ic({ children, size = 16 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const EditIcon = () => (<Ic><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></Ic>);
const TrashSmallIcon = () => (<Ic><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></Ic>);
const SearchIcon = () => (<Ic><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>);
const PlusIcon = () => (<Ic><path d="M5 12h14M12 5v14" /></Ic>);
const TicketIcon = () => (
  <Ic size={26}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z" />
    <path d="M13 5v2M13 11v2M13 17v2" />
  </Ic>
);

/* ---------- Tipe & helper ---------- */
interface Category {
  id: number; event_id: number; name: string; benefits?: string | null;
  price: number; quota: number; remaining_quota: number;
}
interface EventLite { id: number; title: string; }

const PAGE_SIZE = 8;

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
.cadmin-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 18px;
  background-color: #3b82f6; color: #ffffff;
  border: none; border-radius: 9px;
  font-family: inherit; font-size: 13.5px; font-weight: 700;
  cursor: pointer; flex-shrink: 0;
  transition: background-color 0.15s ease;
}
.cadmin-btn-primary:hover { background-color: #2563eb; }
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
.cadmin-select { min-width: 180px; cursor: pointer; }
.cadmin-table-wrap { overflow-x: auto; }
.cadmin-table { width: 100%; border-collapse: collapse; min-width: 960px; }
.cadmin-table th {
  text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8;
  padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); white-space: nowrap;
}
.cadmin-table td { font-size: 13px; color: #e2e8f0; padding: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.07); vertical-align: middle; }
.cadmin-table tbody tr { transition: background-color 0.15s ease; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }
.cadmin-cat-pill {
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px;
  background-color: #334155; color: #e2e8f0; white-space: nowrap;
}
.cadmin-table th.cadmin-num-right, .cadmin-table td.cadmin-num-right { text-align: right; }
.cadmin-rem-left { font-size: 12.5px; font-weight: 600; color: #ffffff; }
.cadmin-rem-pct { font-size: 11.5px; color: #94a3b8; }
.cadmin-quota-bar { display: flex; flex-direction: column; gap: 6px; min-width: 170px; }
.cadmin-quota-bar-track { height: 7px; border-radius: 999px; background-color: rgba(148, 163, 184, 0.12); overflow: hidden; }
.cadmin-quota-bar-fill { display: block; height: 100%; border-radius: 999px; }
.cadmin-actions { display: flex; gap: 2px; justify-content: flex-end; }
.cadmin-icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; color: #94a3b8;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-icon-btn:hover { background-color: rgba(148, 163, 184, 0.10); color: #ffffff; }
.cadmin-icon-btn.danger:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
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
.cadmin-pg-btn:hover:not(:disabled):not(.active) { background-color: rgba(148, 163, 184, 0.08); color: #ffffff; }
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

@media (max-width: 720px) {
  .cadmin-search .cadmin-input { min-width: 0; width: 100%; }
  .cadmin-search { width: 100%; }
}
`;

type FormMode = 'add' | 'edit';

export default function TicketCategoriesPage() {
  const [events, setEvents] = useState<EventLite[]>([]);
  const [concertFilter, setConcertFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const { toast, showToast, clearToast } = useAdminToast();

  const fetchCategories = (list: EventLite[] = events) => {
    setLoading(true);
    if (list.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    Promise.all(
      list.map((ev) =>
        ticketCategoryService.getByEvent(ev.id)
          .then((d) => (d?.data || d?.categories || d || []).map((c: any) => ({ ...c, event_id: ev.id })))
          .catch(() => [])
      )
    )
      .then((groups) => setRows(groups.flat() as Category[]))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    eventService.getAll()
      .then((d) => {
        const list: EventLite[] = d?.data || d?.events || d || [];
        setEvents(list);
        fetchCategories(list);
      })
      .catch(() => {
        showToast('Gagal memuat data konser', 'error');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time listener: refresh kategori saat kuota berubah
  useRealtime('categories:changed', () => {
    fetchCategories();
  }, [events.length]);

  const eventTitle = (eventId: number) => events.find((e) => e.id === eventId)?.title ?? '-';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((c) => {
      const matchQ = !q || c.name?.toLowerCase().includes(q) || eventTitle(c.event_id).toLowerCase().includes(q);
      const matchE = !concertFilter || String(c.event_id) === concertFilter;
      return matchQ && matchE;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, concertFilter, events]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const visible = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const openAdd = () => {
    if (events.length === 0) {
      showToast('Tambahkan konser terlebih dahulu sebelum membuat kategori', 'error');
      return;
    }
    setEditing(null);
    setFormMode('add');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await ticketCategoryService.delete(deleting.id);
      setDeleting(null);
      showToast('Kategori tiket berhasil dihapus');
      fetchCategories();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Gagal menghapus kategori', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cadmin-page">
      <style>{styles}</style>
      <UiStyles />

      {/* Header */}
      <div className="cadmin-head">
        <div>
          <h1 className="cadmin-h1">Kategori Tiket</h1>
          <p className="cadmin-sub">Manage ticket categories, prices and quotas.</p>
        </div>
        <button className="cadmin-btn-primary" onClick={openAdd}>
          <PlusIcon /> Add Category
        </button>
      </div>

      <div className="cadmin-card">
        <div className="cadmin-toolbar" style={{ marginBottom: 16 }}>
          <div className="cadmin-search">
            <SearchIcon />
            <input
              className="cadmin-input"
              placeholder="Search category or concert..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="cadmin-select"
            value={concertFilter}
            onChange={(e) => { setConcertFilter(e.target.value); setPage(1); }}
          >
            <option value="">All concerts</option>
            {events.map((ev) => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="cadmin-loading">Memuat data...</div>
        ) : visible.length === 0 ? (
          <div className="cadmin-empty">
            <div className="cadmin-empty-icon"><TicketIcon /></div>
            <div className="cadmin-empty-title">
              {search || concertFilter ? 'Kategori tidak ditemukan' : 'Belum ada kategori tiket'}
            </div>
            <div className="cadmin-empty-text">
              {search || concertFilter
                ? 'Coba ubah kata kunci atau filter yang digunakan.'
                : 'Tambahkan kategori tiket untuk konser yang sudah dibuat.'}
            </div>
          </div>
        ) : (
          <div className="cadmin-table-wrap">
            <table className="cadmin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Concert</th>
                  <th>Ticket Price</th>
                  <th>Total Quota</th>
                  <th>Sold</th>
                  <th>Remaining Quota</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const sold = c.quota - c.remaining_quota;
                  const pct = c.quota > 0 ? Math.round((sold / c.quota) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="cadmin-cat-pill">{c.name}</span>
                      </td>
                      <td style={{ color: '#e2e8f0' }}>{eventTitle(c.event_id)}</td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>Rp {Number(c.price).toLocaleString('id-ID')}</td>
                      <td style={{ color: '#94a3b8' }}>{c.quota.toLocaleString('id-ID')}</td>
                      <td style={{ color: '#94a3b8' }}>{sold.toLocaleString('id-ID')}</td>
                      <td>
                        <div className="cadmin-quota-bar">
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <span className="cadmin-rem-left">{c.remaining_quota.toLocaleString('id-ID')} left</span>
                            <span className="cadmin-rem-pct">{pct}%</span>
                          </div>
                          <div className="cadmin-quota-bar-track">
                            <span
                              className="cadmin-quota-bar-fill"
                              style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? '#f59e0b' : '#3b82f6' }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cadmin-actions">
                          <button className="cadmin-icon-btn" title="Edit" onClick={() => { setEditing(c); setFormMode('edit'); }}><EditIcon /></button>
                          <button className="cadmin-icon-btn danger" title="Hapus" onClick={() => setDeleting(c)}><TrashSmallIcon /></button>
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
            Showing {visible.length === 0 ? 0 : (pageSafe - 1) * PAGE_SIZE + 1}-{(pageSafe - 1) * PAGE_SIZE + visible.length} of {filtered.length}
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

      {formMode ? (
        <CategoryForm
          mode={formMode}
          category={editing}
          events={events}
          defaultEventId={concertFilter}
          onClose={() => setFormMode(null)}
          onSaved={() => {
            setFormMode(null);
            showToast(formMode === 'add' ? 'Kategori tiket berhasil ditambahkan' : 'Kategori tiket berhasil diperbarui');
            fetchCategories();
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Hapus kategori ini?"
          message={
            <>
              Kategori <strong>{deleting.name}</strong> pada konser{' '}
              <strong>{eventTitle(deleting.event_id)}</strong> akan dihapus permanen. Tindakan ini tidak
              dapat dibatalkan.
            </>
          }
          confirmLabel="Hapus Kategori"
          tone="red"
          icon={<TrashIcon />}
          loading={busy}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      ) : null}

      {toast ? <AdminToast message={toast.message} tone={toast.tone} onDone={clearToast} /> : null}
    </div>
  );
}

/* ============================================================
   Form tambah/edit kategori (modal)
   ============================================================ */
function CategoryForm({ mode, category, events, defaultEventId, onClose, onSaved, onError }: {
  mode: FormMode;
  category: Category | null;
  events: EventLite[];
  defaultEventId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const initialEvent = category?.event_id
    ? String(category.event_id)
    : defaultEventId || (events[0] ? String(events[0].id) : '');

  const [eventId, setEventId] = useState(initialEvent);
  const [name, setName] = useState(category?.name ?? '');
  const [price, setPrice] = useState(category ? String(category.price) : '');
  const [quota, setQuota] = useState(category ? String(category.quota) : '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const sold = category ? category.quota - category.remaining_quota : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!eventId) {
      setErr('Pilih konser terlebih dahulu.');
      return;
    }
    if (!name.trim()) {
      setErr('Nama kategori wajib diisi.');
      return;
    }
    if (!price || Number(price) < 0) {
      setErr('Harga tiket wajib diisi dengan benar.');
      return;
    }
    if (!quota || Number(quota) < 1) {
      setErr('Total kuota minimal 1 tiket.');
      return;
    }
    if (mode === 'edit' && Number(quota) < sold) {
      setErr(`Kuota tidak boleh lebih kecil dari tiket terjual (${sold}).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        quota: Number(quota),
      };

      if (mode === 'add') await ticketCategoryService.create(Number(eventId), payload);
      else await ticketCategoryService.update(category!.id, payload);
      onSaved();
    } catch (ex: any) {
      const msg = ex?.response?.data?.message || 'Gagal menyimpan kategori';
      setErr(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title={mode === 'add' ? 'Add Ticket Category' : 'Edit Ticket Category'}
      subtitle="Set the price and available quota."
      onClose={onClose}
      maxWidth={520}
      footer={
        <>
          <button type="button" className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="category-form" className="cadmin-ui-btn cadmin-ui-btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : mode === 'add' ? 'Add Category' : 'Save Changes'}
          </button>
        </>
      }
    >
      {err ? <div className="cadmin-ui-error">{err}</div> : null}

      <form id="category-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="cadmin-ui-field">
          <label className="cadmin-ui-label" htmlFor="category-concert">Concert</label>
          <select
            id="category-concert"
            className="cadmin-ui-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            disabled={mode === 'edit'}
          >
            <option value="" disabled>Pilih konser</option>
            {events.map((ev) => <option key={ev.id} value={String(ev.id)}>{ev.title}</option>)}
          </select>
        </div>

        <div className="cadmin-ui-field">
          <label className="cadmin-ui-label" htmlFor="category-name">Category Name</label>
          <input
            id="category-name"
            className="cadmin-ui-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP, Festival, Regular"
            autoFocus
          />
        </div>

        <div className="cadmin-ui-grid">
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="category-price">Ticket Price (IDR)</label>
            <input
              id="category-price"
              className="cadmin-ui-input"
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 750000"
            />
          </div>
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="category-quota">Total Quota</label>
            <input
              id="category-quota"
              className="cadmin-ui-input"
              type="number"
              min={1}
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
        </div>

        {mode === 'edit' ? (
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
            {sold} tiket sudah terjual. Kuota baru tidak boleh lebih kecil dari jumlah tersebut.
          </p>
        ) : null}
      </form>
    </AdminModal>
  );
}
