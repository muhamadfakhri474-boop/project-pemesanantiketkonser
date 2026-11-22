import { useEffect, useMemo, useRef, useState } from 'react';
import { eventService, artistService } from '../../api/services';
import dayjs from 'dayjs';
import {
  AdminModal,
  AdminToast,
  ConfirmDialog,
  UiStyles,
  TrashIcon,
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
const EyeIcon = () => (<Ic><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Ic>);
const EditIcon = () => (<Ic><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></Ic>);
const TrashSmallIcon = () => (<Ic><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></Ic>);
const SearchIcon = () => (<Ic><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>);
const PlusIcon = () => (<Ic><path d="M5 12h14M12 5v14" /></Ic>);
const UploadIcon = () => (
  <Ic size={24}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </Ic>
);
const CalendarIcon = () => (
  <Ic size={26}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </Ic>
);

/* ---------- Tipe & helper ---------- */
interface ArtistSummary {
  id: number;
  name: string;
  photo?: string | null;
  genre?: string | null;
}

interface EventRow {
  id: number;
  title: string;
  description?: string;
  venue: string;
  city: string;
  genre?: string;
  event_date: string;
  event_time: string;
  poster?: string | null;
  status: 'open' | 'closed';
  artist_id: number;
  artist_name: string;
  artist_photo?: string | null;
  artist_ids?: number[];
  artists?: ArtistSummary[];
}

interface Artist {
  id: number;
  name: string;
  genre?: string | null;
  photo?: string | null;
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

const PAGE_SIZE = 5;
const fmtID = (s: string) => {
  const [h, m] = s.split(':');
  return `${h}:${m} WIB`;
};

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
.cadmin-select { min-width: 160px; cursor: pointer; }
.cadmin-table-wrap { overflow-x: auto; }
.cadmin-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.cadmin-table th {
  text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8;
  padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); white-space: nowrap;
}
.cadmin-table td { font-size: 13px; color: #e2e8f0; padding: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.07); vertical-align: middle; }
.cadmin-table tbody tr { transition: background-color 0.15s ease; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }
.cadmin-poster { width: 46px; height: 46px; border-radius: 9px; object-fit: cover; display: block; background-color: #0e1828; }
.cadmin-ev-name { font-size: 13.5px; font-weight: 600; color: #f8fafc; }
.cadmin-ev-time { font-size: 11.5px; color: #94a3b8; margin-top: 3px; }
.cadmin-ev-venue { font-size: 12.5px; color: #e2e8f0; }
.cadmin-ev-city { font-size: 11.5px; color: #94a3b8; margin-top: 3px; }
.cadmin-actions { display: flex; gap: 2px; }
.cadmin-icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; color: #94a3b8;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-icon-btn:hover { background-color: rgba(148, 163, 184, 0.10); color: #ffffff; }
.cadmin-icon-btn.danger:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }
.cadmin-switch {
  position: relative; width: 40px; height: 22px; border-radius: 999px;
  border: none; cursor: pointer; transition: background-color 0.18s ease; flex-shrink: 0;
}
.cadmin-switch::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; border-radius: 50%; background-color: #ffffff;
  transition: transform 0.18s ease;
}
.cadmin-switch.on { background-color: #3b82f6; }
.cadmin-switch.on::after { transform: translateX(18px); }
.cadmin-switch.off { background-color: rgba(255, 255, 255, 0.16); }
.cadmin-sales-cell { display: flex; align-items: center; gap: 10px; }
.cadmin-pill {
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; white-space: nowrap;
}
.cadmin-pill::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background-color: currentColor; margin-right: 6px;
}
.cadmin-pill.open { background-color: rgba(34, 197, 94, 0.16); color: #22c55e; }
.cadmin-pill.closed { background-color: rgba(148, 163, 184, 0.16); color: #94a3b8; }
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
.cadmin-poster-grid {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

/* Artist chips in table */
.cadmin-artist-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-width: 250px;
}
.cadmin-artist-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.24);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}
.cadmin-artist-pill.headliner {
  background: rgba(59, 130, 246, 0.22);
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.45);
}

/* Multi-Artist Select in Modal */
.cadmin-artist-select-container {
  position: relative;
  width: 100%;
}
.cadmin-artist-trigger {
  width: 100%;
  min-height: 44px;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 9px;
  padding: 6px 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.cadmin-artist-trigger:hover {
  border-color: rgba(59, 130, 246, 0.35);
}
.cadmin-artist-trigger.active {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
.cadmin-chip-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #16233a;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 7px;
  padding: 3px 8px;
  color: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}
.cadmin-chip-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #1e293b;
}
.cadmin-chip-thumb-fallback {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #2563eb;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
}
.cadmin-chip-badge {
  font-size: 9.5px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.14);
  padding: 1px 4px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.cadmin-chip-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s ease;
  font-size: 13px;
  line-height: 1;
}
.cadmin-chip-del:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
.cadmin-artist-placeholder {
  color: #64748b;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
}
.cadmin-artist-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
  border: 1px dashed rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cadmin-artist-add-btn:hover {
  background: rgba(59, 130, 246, 0.24);
  border-color: #3b82f6;
  color: #ffffff;
}
.cadmin-artist-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #111c2e;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  z-index: 100;
  padding: 10px;
  box-sizing: border-box;
}
.cadmin-dropdown-search {
  position: relative;
  margin-bottom: 8px;
}
.cadmin-dropdown-search svg {
  position: absolute;
  left: 10px;
  top: 9px;
  color: #94a3b8;
  pointer-events: none;
}
.cadmin-dropdown-input {
  width: 100%;
  height: 34px;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 7px;
  color: #f8fafc;
  font-size: 12.5px;
  padding: 0 10px 0 32px;
  box-sizing: border-box;
  outline: none;
}
.cadmin-dropdown-input:focus {
  border-color: #3b82f6;
}
.cadmin-dropdown-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cadmin-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 9px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.14s ease;
  user-select: none;
}
.cadmin-dropdown-item:hover {
  background-color: rgba(59, 130, 246, 0.12);
}
.cadmin-dropdown-item.selected {
  background-color: rgba(59, 130, 246, 0.18);
}
.cadmin-dropdown-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.cadmin-dropdown-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1.5px solid rgba(148, 163, 184, 0.3);
  background-color: #0e1828;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}
.cadmin-dropdown-item.selected .cadmin-dropdown-check {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
.cadmin-dropdown-artist-img {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background-color: #1e293b;
}
.cadmin-dropdown-artist-placeholder {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background-color: #1e293b;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.cadmin-dropdown-name {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cadmin-dropdown-genre {
  font-size: 11px;
  color: #94a3b8;
}
.cadmin-dropdown-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  margin-top: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 11.5px;
  color: #94a3b8;
}
.cadmin-dropdown-foot-btn {
  background: transparent;
  border: none;
  color: #60a5fa;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
}
.cadmin-dropdown-foot-btn:hover {
  background: rgba(59, 130, 246, 0.12);
}

/* Lineup cards in detail modal */
.cadmin-lineup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 8px;
}
.cadmin-lineup-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 10px;
  padding: 8px 12px;
}
.cadmin-lineup-img {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.cadmin-lineup-img-placeholder {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background-color: #1e293b;
  color: #60a5fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.cadmin-lineup-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
}
.cadmin-headliner-badge {
  font-size: 9.5px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border-radius: 4px;
  padding: 1px 5px;
  margin-left: 4px;
  text-transform: uppercase;
}
.cadmin-lineup-genre {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
}

@media (max-width: 720px) {
  .cadmin-search .cadmin-input { min-width: 0; width: 100%; }
  .cadmin-search { width: 100%; }
}

@media (max-width: 640px) {
  .cadmin-poster-grid { grid-template-columns: 1fr; }
}
`;

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [page, setPage] = useState(1);

  /* Modal */
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<EventRow | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const { toast, showToast, clearToast } = useAdminToast();

  const fetchEvents = () => {
    eventService.getAll()
      .then((d) => setEvents(d?.data || d?.events || d || []))
      .catch(() => showToast('Gagal memuat data konser', 'error'))
      .finally(() => setLoading(false));
  };

  const fetchArtists = () => {
    artistService.getAll()
      .then((d) => setArtists(d?.data || d?.artists || d || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchEvents();
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time listener: refresh event saat ada perubahan
  useRealtime('dashboard:changed', fetchEvents, []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase();
      const matchQ = !q || [ev.title, ev.artist_name, ev.venue, ev.city, ev.genre].some((f) => f?.toLowerCase().includes(q));
      const matchS = !statusFilter || ev.status === statusFilter;
      const matchA = !artistFilter ||
        (Array.isArray(ev.artist_ids) && ev.artist_ids.includes(Number(artistFilter))) ||
        String(ev.artist_id) === artistFilter;
      return matchQ && matchS && matchA;
    });
  }, [events, search, statusFilter, artistFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const rows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const handleToggle = async (ev: EventRow) => {
    setTogglingId(ev.id);
    try {
      const next = ev.status === 'open' ? 'closed' : 'open';
      await eventService.setStatus(ev.id, next);
      showToast(next === 'open' ? 'Penjualan tiket dibuka' : 'Penjualan tiket ditutup');
      fetchEvents();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Gagal mengubah status penjualan', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await eventService.delete(deleting.id);
      setDeleting(null);
      showToast('Konser berhasil dihapus');
      fetchEvents();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Gagal menghapus konser', 'error');
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => {
    if (artists.length === 0) {
      showToast('Tambahkan artis terlebih dahulu sebelum membuat konser', 'error');
      return;
    }
    setCurrent(null);
    setModalMode('add');
  };

  return (
    <div className="cadmin-page">
      <style>{styles}</style>
      <UiStyles />

      {/* Header */}
      <div className="cadmin-head">
        <div>
          <h1 className="cadmin-h1">Event / Konser</h1>
          <p className="cadmin-sub">Manage concerts and control ticket sales.</p>
        </div>
        <button className="cadmin-btn-primary" onClick={openAdd}>
          <PlusIcon /> Add Concert
        </button>
      </div>

      {/* Tabel */}
      <div className="cadmin-card">
        <div className="cadmin-toolbar" style={{ marginBottom: 16 }}>
          <div className="cadmin-search">
            <SearchIcon />
            <input
              className="cadmin-input"
              placeholder="Search concert, artist, venue..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="cadmin-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All sales status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <select className="cadmin-select" value={artistFilter} onChange={(e) => { setArtistFilter(e.target.value); setPage(1); }}>
            <option value="">All artists</option>
            {artists.map((a) => <option key={a.id} value={String(a.id)}>{a.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="cadmin-loading">Memuat data...</div>
        ) : rows.length === 0 ? (
          <div className="cadmin-empty">
            <div className="cadmin-empty-icon"><CalendarIcon /></div>
            <div className="cadmin-empty-title">{search || statusFilter || artistFilter ? 'Konser tidak ditemukan' : 'Belum ada konser'}</div>
            <div className="cadmin-empty-text">
              {search || statusFilter || artistFilter
                ? 'Coba ubah kata kunci atau filter yang digunakan.'
                : 'Tambahkan konser pertama Anda untuk mulai menjual tiket.'}
            </div>
          </div>
        ) : (
          <div className="cadmin-table-wrap">
            <table className="cadmin-table">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Concert Name</th>
                  <th>Artist Lineup</th>
                  <th>Event Date</th>
                  <th>Venue</th>
                  <th>Ticket Sales</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <img
                        className="cadmin-poster"
                        src={ev.poster ? imgUrl(ev.poster) : placeholder(ev.title.slice(0, 1).toUpperCase())}
                        alt={ev.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = placeholder(ev.title.slice(0, 1).toUpperCase()); }}
                      />
                    </td>
                    <td>
                      <div className="cadmin-ev-name">{ev.title}</div>
                      {ev.event_time && <div className="cadmin-ev-time">{fmtID(ev.event_time)}</div>}
                    </td>
                    <td>
                      <div className="cadmin-artist-chips">
                        {ev.artists && ev.artists.length > 0 ? (
                          ev.artists.map((a, i) => (
                            <span
                              key={a.id || i}
                              className={`cadmin-artist-pill ${i === 0 ? 'headliner' : ''}`}
                              title={a.genre ? `${a.name} (${a.genre})` : a.name}
                            >
                              {i === 0 && ev.artists!.length > 1 ? '★ ' : ''}{a.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#94a3b8' }}>{ev.artist_name || '-'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{dayjs(ev.event_date).format('DD MMM YYYY')}</td>
                    <td>
                      <div className="cadmin-ev-venue">{ev.venue}</div>
                      <div className="cadmin-ev-city">{ev.city}</div>
                    </td>
                    <td>
                      <div className="cadmin-sales-cell">
                        <button
                          className={`cadmin-switch ${ev.status === 'open' ? 'on' : 'off'}`}
                          onClick={() => handleToggle(ev)}
                          disabled={togglingId === ev.id}
                          title={ev.status === 'open' ? 'Tutup penjualan' : 'Buka penjualan'}
                        />
                        <span className={`cadmin-pill ${ev.status === 'open' ? 'open' : 'closed'}`}>
                          {ev.status === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cadmin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="cadmin-icon-btn" title="Lihat detail" onClick={() => { setCurrent(ev); setModalMode('view'); }}><EyeIcon /></button>
                        <button className="cadmin-icon-btn" title="Edit" onClick={() => { setCurrent(ev); setModalMode('edit'); }}><EditIcon /></button>
                        <button className="cadmin-icon-btn danger" title="Hapus" onClick={() => setDeleting(ev)}><TrashSmallIcon /></button>
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

      {/* Modal tambah/edit */}
      {modalMode === 'add' || modalMode === 'edit' ? (
        <EventForm
          mode={modalMode}
          event={current}
          artists={artists}
          onClose={() => setModalMode(null)}
          onSaved={() => {
            setModalMode(null);
            showToast(modalMode === 'add' ? 'Konser berhasil ditambahkan' : 'Konser berhasil diperbarui');
            fetchEvents();
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      ) : null}

      {/* Modal detail */}
      {modalMode === 'view' && current ? (
        <EventDetail event={current} onClose={() => setModalMode(null)} />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Hapus konser ini?"
          message={
            <>
              Konser <strong>{deleting.title}</strong> beserta kategori tiket dan data pesanan terkait
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </>
          }
          confirmLabel="Hapus Konser"
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
   Komponen Pemilih Multi-Artis (Modern Dark Multi-Select)
   ============================================================ */
function MultiArtistSelect({
  artists,
  selectedIds,
  onChange,
}: {
  artists: Artist[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const toggleArtist = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeArtist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    onChange(selectedIds.filter((x) => x !== id));
  };

  const selectedArtists = useMemo(() => {
    return selectedIds
      .map((id) => artists.find((a) => a.id === id))
      .filter((a): a is Artist => Boolean(a));
  }, [selectedIds, artists]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return artists;
    return artists.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.genre && a.genre.toLowerCase().includes(q))
    );
  }, [artists, query]);

  return (
    <div className="cadmin-artist-select-container" ref={containerRef}>
      <div
        className={`cadmin-artist-trigger ${open ? 'active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedArtists.length === 0 ? (
          <div className="cadmin-artist-placeholder">
            <PlusIcon />
            <span>Pilih artis yang akan tampil di konser ini (bisa lebih dari satu)...</span>
          </div>
        ) : (
          <>
            {selectedArtists.map((a, idx) => (
              <span key={a.id} className="cadmin-chip-item">
                {a.photo ? (
                  <img src={imgUrl(a.photo)} alt={a.name} className="cadmin-chip-thumb" />
                ) : (
                  <span className="cadmin-chip-thumb-fallback">{a.name.slice(0, 1).toUpperCase()}</span>
                )}
                <span>{a.name}</span>
                {idx === 0 && <span className="cadmin-chip-badge">Utama</span>}
                <button
                  type="button"
                  className="cadmin-chip-del"
                  title="Hapus dari lineup"
                  onClick={(e) => removeArtist(e, a.id)}
                >
                  &times;
                </button>
              </span>
            ))}
            <button
              type="button"
              className="cadmin-artist-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
            >
              + Tambah Artis
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="cadmin-artist-dropdown">
          <div className="cadmin-dropdown-search">
            <SearchIcon />
            <input
              className="cadmin-dropdown-input"
              placeholder="Cari artis atau genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="cadmin-dropdown-list">
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                Artis tidak ditemukan
              </div>
            ) : (
              filtered.map((a) => {
                const isSelected = selectedIds.includes(a.id);
                const isFirst = selectedIds[0] === a.id;
                return (
                  <div
                    key={a.id}
                    className={`cadmin-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleArtist(a.id)}
                  >
                    <div className="cadmin-dropdown-item-left">
                      <span className="cadmin-dropdown-check">
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      {a.photo ? (
                        <img src={imgUrl(a.photo)} alt={a.name} className="cadmin-dropdown-artist-img" />
                      ) : (
                        <span className="cadmin-dropdown-artist-placeholder">{a.name.slice(0, 1).toUpperCase()}</span>
                      )}
                      <div>
                        <div className="cadmin-dropdown-name">{a.name}</div>
                        {a.genre && <div className="cadmin-dropdown-genre">{a.genre}</div>}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 11, color: isFirst ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                        {isFirst ? '★ Artis Utama' : 'Lineup'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="cadmin-dropdown-foot">
            <span>{selectedIds.length} artis terpilih</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {selectedIds.length < artists.length && (
                <button
                  type="button"
                  className="cadmin-dropdown-foot-btn"
                  onClick={() => onChange(artists.map((a) => a.id))}
                >
                  Pilih Semua
                </button>
              )}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  className="cadmin-dropdown-foot-btn"
                  style={{ color: '#ef4444' }}
                  onClick={() => onChange([])}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="cadmin-dropdown-foot-btn"
                style={{ color: '#ffffff' }}
                onClick={() => setOpen(false)}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Form tambah/edit konser (modal)
   ============================================================ */
function EventForm({ mode, event, artists, onClose, onSaved, onError }: {
  mode: 'add' | 'edit';
  event: EventRow | null;
  artists: Artist[];
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>(() => {
    if (event?.artist_ids && event.artist_ids.length > 0) return event.artist_ids;
    if (event?.artist_id) return [event.artist_id];
    return [];
  });

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [venue, setVenue] = useState(event?.venue ?? '');
  const [city, setCity] = useState(event?.city ?? '');
  const [genre, setGenre] = useState(event?.genre ?? '');
  const [status, setStatus] = useState<'open' | 'closed'>(event?.status ?? 'open');
  const [eventDate, setEventDate] = useState(event ? dayjs(event.event_date).format('YYYY-MM-DD') : '');
  const [eventTime, setEventTime] = useState(event?.event_time?.slice(0, 5) ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(event?.poster ? imgUrl(event.poster) : '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (selectedArtistIds.length === 0 || !title.trim() || !venue.trim() || !city.trim() || !eventDate || !eventTime) {
      setErr('Pilih minimal satu artis, lalu lengkapi nama konser, venue, kota, tanggal, dan jam terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('artist_ids', JSON.stringify(selectedArtistIds));
      selectedArtistIds.forEach((id) => fd.append('artist_ids[]', String(id)));
      fd.append('artist_id', String(selectedArtistIds[0]));
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('venue', venue.trim());
      fd.append('city', city.trim());
      fd.append('genre', genre.trim());
      fd.append('status', status);
      fd.append('event_date', eventDate);
      fd.append('event_time', eventTime);
      if (file) fd.append('poster', file);

      if (mode === 'add') await eventService.create(fd);
      else await eventService.update(event!.id, fd);
      onSaved();
    } catch (ex: any) {
      const msg = ex?.response?.data?.message || 'Gagal menyimpan konser';
      setErr(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title={mode === 'add' ? 'Add Concert' : 'Edit Concert'}
      subtitle="Concert details shown in the mobile app."
      onClose={onClose}
      maxWidth={680}
      footer={
        <>
          <button type="button" className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="event-form" className="cadmin-ui-btn cadmin-ui-btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : mode === 'add' ? 'Add Concert' : 'Save Changes'}
          </button>
        </>
      }
    >
      {err ? <div className="cadmin-ui-error">{err}</div> : null}

      <form id="event-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="cadmin-poster-grid">
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label">Concert Poster</label>
            <div className="cadmin-ui-upload" style={{ minHeight: 190 }} onClick={() => inputRef.current?.click()}>
              {preview ? (
                <img className="cadmin-ui-upload-preview" style={{ height: 190 }} src={preview} alt="Preview poster" />
              ) : (
                <>
                  <UploadIcon />
                  <span className="cadmin-ui-upload-title">Upload image</span>
                  <span className="cadmin-ui-upload-hint">PNG or JPG, max 5 MB</span>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="cadmin-ui-field">
              <label className="cadmin-ui-label" htmlFor="event-title">Concert Name</label>
              <input
                id="event-title"
                className="cadmin-ui-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midnight Reverie Festival"
                autoFocus
              />
            </div>

            <div className="cadmin-ui-grid" style={{ gap: 12 }}>
              <div className="cadmin-ui-field">
                <label className="cadmin-ui-label" htmlFor="event-genre">Music Genre</label>
                <input
                  id="event-genre"
                  className="cadmin-ui-input"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Pop / Rock"
                />
              </div>
              <div className="cadmin-ui-field">
                <label className="cadmin-ui-label" htmlFor="event-status">Ticket Sales</label>
                <select
                  id="event-status"
                  className="cadmin-ui-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pemilihan Multi-Artis */}
        <div className="cadmin-ui-field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label className="cadmin-ui-label" style={{ margin: 0 }}>
              Lineup Artis / Performer
            </label>
            <span style={{ fontSize: 11.5, color: '#60a5fa', fontWeight: 600 }}>
              {selectedArtistIds.length > 0
                ? `${selectedArtistIds.length} artis dipilih`
                : 'Pilih artis (bisa lebih dari satu)'}
            </span>
          </div>

          <MultiArtistSelect
            artists={artists}
            selectedIds={selectedArtistIds}
            onChange={(ids) => {
              setSelectedArtistIds(ids);
              // Auto-fill genre jika genre masih kosong dan ada artis yang dipilih
              if (!genre.trim() && ids.length > 0) {
                const first = artists.find((a) => a.id === ids[0]);
                if (first?.genre) setGenre(first.genre);
              }
            }}
          />
        </div>

        <div className="cadmin-ui-field">
          <label className="cadmin-ui-label" htmlFor="event-desc">Description</label>
          <textarea
            id="event-desc"
            className="cadmin-ui-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short concert description"
          />
        </div>

        <div className="cadmin-ui-grid">
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="event-venue">Venue</label>
            <input
              id="event-venue"
              className="cadmin-ui-input"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Istora Senayan"
            />
          </div>
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="event-city">City</label>
            <input
              id="event-city"
              className="cadmin-ui-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Jakarta"
            />
          </div>
        </div>

        <div className="cadmin-ui-grid">
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="event-date">Event Date</label>
            <input
              id="event-date"
              className="cadmin-ui-input"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label" htmlFor="event-time">Event Time</label>
            <input
              id="event-time"
              className="cadmin-ui-input"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
        </div>
      </form>
    </AdminModal>
  );
}

/* ============================================================
   Detail konser (modal)
   ============================================================ */
function EventDetail({ event, onClose }: { event: EventRow; onClose: () => void }) {
  const [cats, setCats] = useState<{ id: number; name: string; price: number; quota: number; remaining_quota: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getById(event.id)
      .then((d) => setCats(d?.ticket_categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [event.id]);

  const lineup = useMemo(() => {
    if (event.artists && event.artists.length > 0) return event.artists;
    return [{ id: event.artist_id, name: event.artist_name, photo: event.artist_photo, genre: event.genre }];
  }, [event]);

  return (
    <AdminModal
      title={event.title}
      subtitle={`${event.artist_name} · ${dayjs(event.event_date).format('DD MMM YYYY')}`}
      onClose={onClose}
      maxWidth={580}
      footer={
        <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="cadmin-ui-section">
        <div className="cadmin-ui-box">
          {/* Lineup Artis */}
          <div className="cadmin-ui-box-row">
            <div className="cadmin-ui-cell" style={{ gridColumn: 'span 2' }}>
              <div className="cadmin-ui-cell-label">Lineup Artis ({lineup.length})</div>
              <div className="cadmin-lineup-grid">
                {lineup.map((a, idx) => (
                  <div key={a.id || idx} className="cadmin-lineup-card">
                    {a.photo ? (
                      <img src={imgUrl(a.photo)} alt={a.name} className="cadmin-lineup-img" />
                    ) : (
                      <div className="cadmin-lineup-img-placeholder">{a.name?.slice(0, 1).toUpperCase()}</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="cadmin-lineup-name">
                        {a.name}
                        {idx === 0 && <span className="cadmin-headliner-badge">Utama</span>}
                      </div>
                      {a.genre && <div className="cadmin-lineup-genre">{a.genre}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cadmin-ui-box-row">
            <div className="cadmin-ui-cell">
              <div className="cadmin-ui-cell-label">Genre</div>
              <div className="cadmin-ui-cell-value">{event.genre || '-'}</div>
            </div>
            <div className="cadmin-ui-cell">
              <div className="cadmin-ui-cell-label">Date &amp; Time</div>
              <div className="cadmin-ui-cell-value">
                {dayjs(event.event_date).format('DD MMM YYYY')}
                {event.event_time ? ` · ${fmtID(event.event_time)}` : ''}
              </div>
            </div>
          </div>
          <div className="cadmin-ui-box-row">
            <div className="cadmin-ui-cell">
              <div className="cadmin-ui-cell-label">Venue</div>
              <div className="cadmin-ui-cell-value">{event.venue}, {event.city}</div>
            </div>
            <div className="cadmin-ui-cell">
              <div className="cadmin-ui-cell-label">Ticket Sales</div>
              <div className="cadmin-ui-cell-value" style={{ textTransform: 'capitalize' }}>{event.status}</div>
            </div>
          </div>
        </div>

        {event.description ? (
          <div>
            <div className="cadmin-ui-cell-label" style={{ marginBottom: 4 }}>Description</div>
            <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{event.description}</p>
          </div>
        ) : null}

        <div>
          <div className="cadmin-ui-cell-label" style={{ marginBottom: 8 }}>Ticket Categories ({cats.length})</div>
          {loading ? (
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Memuat kategori...</div>
          ) : cats.length === 0 ? (
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>Belum ada kategori tiket untuk konser ini.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cats.map((c) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', backgroundColor: '#0e1828',
                  border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 10
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Sisa {c.remaining_quota} / {c.quota} tiket</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>
                    Rp {Number(c.price).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
