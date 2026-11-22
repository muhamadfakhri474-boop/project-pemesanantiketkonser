import { useEffect, useMemo, useRef, useState } from 'react';
import { artistService, eventService } from '../../api/services';
import {
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
const EyeIcon = () => (<Ic><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Ic>);
const EditIcon = () => (<Ic><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></Ic>);
const TrashSmallIcon = () => (<Ic><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></Ic>);
const SearchIcon = () => (<Ic><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Ic>);
const PlusIcon = () => (<Ic><path d="M5 12h14M12 5v14" /></Ic>);
const GridIcon = () => (
  <Ic size={15}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Ic>
);
const ListIcon = () => (<Ic size={15}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></Ic>);
const UploadIcon = () => (
  <Ic size={26}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </Ic>
);
const MicIcon = () => (
  <Ic size={26}><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Ic>
);

/* ---------- Tipe & helper ---------- */
interface Artist {
  id: number; name: string; description?: string; photo?: string | null;
  genre?: string | null; created_at?: string;
}

const GENRE_OPTIONS = [
  'Pop',
  'Pop Rock',
  'Rock',
  'Indie Pop',
  'Indie Rock',
  'Alternative',
  'Heavy Metal',
  'Metalcore',
  'Post-Hardcore',
  'Punk',
  'Jazz',
  'Blues',
  'R&B',
  'Soul',
  'Hip-Hop',
  'Rap',
  'EDM',
  'Electronic',
  'House',
  'Dangdut',
  'K-Pop',
  'J-Pop',
  'Reggae',
  'Folk',
  'Acoustic',
  'Ambient Pop',
];

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
.cadmin-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.cadmin-search { position: relative; }
.cadmin-search svg { position: absolute; left: 11px; top: 12px; color: #94a3b8; pointer-events: none; }
.cadmin-input {
  height: 40px; background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 9px; color: #e2e8f0;
  font-family: inherit; font-size: 13px; padding: 0 12px;
  box-sizing: border-box; outline: none;
  transition: border-color 0.15s ease;
}
.cadmin-input:focus { border-color: rgba(59, 130, 246, 0.45); }
.cadmin-search .cadmin-input { padding-left: 34px; min-width: 250px; }
.cadmin-view-toggle {
  display: inline-flex; gap: 3px; padding: 3px;
  background-color: #0e1828; border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 9px;
}
.cadmin-view-btn {
  width: 32px; height: 30px; border: none; border-radius: 7px;
  background: transparent; color: #94a3b8; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-view-btn.active { background-color: #e2e8f0; color: #0b1120; }
.cadmin-view-btn:hover:not(.active) { color: #f8fafc; }

/* Kartu artist */
.cadmin-artist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.cadmin-artist-card {
  background-color: #16233a;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px; padding: 18px;
  display: flex; flex-direction: column; min-width: 0;
  transition: border-color 0.15s ease;
}
.cadmin-artist-card:hover { border-color: rgba(59, 130, 246, 0.45); }
.cadmin-artist-top { display: flex; align-items: center; gap: 13px; }
.cadmin-artist-photo {
  width: 56px; height: 56px; border-radius: 12px; object-fit: cover;
  background-color: #0e1828; flex-shrink: 0;
}
.cadmin-artist-initial {
  width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0;
  background-color: #334155; color: #f8fafc;
  font-size: 18px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
}
.cadmin-artist-name { font-size: 14.5px; font-weight: 700; color: #f8fafc; }
.cadmin-artist-genre {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 6px; padding: 3px 10px; border-radius: 999px;
  background-color: rgba(59, 130, 246, 0.18); color: #93c5fd;
  font-size: 11px; font-weight: 700;
}
.cadmin-artist-genre::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background-color: currentColor; }
.cadmin-artist-desc {
  font-size: 12.5px; color: #94a3b8; line-height: 1.6; margin-top: 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.cadmin-artist-foot {
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  margin-top: 14px; padding-top: 12px;
}
.cadmin-artist-count { font-size: 12px; color: #94a3b8; }
.cadmin-artist-actions { display: flex; gap: 2px; }
.cadmin-icon-btn {
  width: 30px; height: 30px; border-radius: 8px; border: none;
  background: transparent; color: #94a3b8;
  display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-icon-btn:hover { background-color: rgba(148, 163, 184, 0.10); color: #ffffff; }
.cadmin-icon-btn.danger:hover { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; }

/* List view */
.cadmin-table-wrap { overflow-x: auto; }
.cadmin-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.cadmin-table th {
  text-align: left; font-size: 12px; font-weight: 600; color: #94a3b8;
  padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.12); white-space: nowrap;
}
.cadmin-table td { font-size: 13px; color: #e2e8f0; padding: 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.07); vertical-align: middle; }
.cadmin-table tbody tr:hover { background-color: rgba(148, 163, 184, 0.05); }
.cadmin-table tbody tr:last-child td { border-bottom: none; }
.cadmin-loading { padding: 32px; text-align: center; color: #94a3b8; font-size: 13.5px; }

/* Empty state */
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

/* Detail view */
.cadmin-detail-grid { display: flex; gap: 18px; align-items: flex-start; }
.cadmin-detail-photo { width: 120px; height: 120px; border-radius: 14px; object-fit: cover; }
.cadmin-photo-grid {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

@media (max-width: 1100px) { .cadmin-artist-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) { .cadmin-artist-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) {
  .cadmin-photo-grid { grid-template-columns: 1fr; }
  .cadmin-detail-grid { flex-direction: column; align-items: center; text-align: center; }
}
`;

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [concertCount, setConcertCount] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<Artist | null>(null);
  const [deleting, setDeleting] = useState<Artist | null>(null);
  const [busy, setBusy] = useState(false);

  const { toast, showToast, clearToast } = useAdminToast();

  const fetchConcerts = () => {
    eventService.getAll()
      .then((d) => {
        const events = d?.data || d?.events || d || [];
        const count: Record<number, number> = {};
        events.forEach((ev: any) => {
          if (Array.isArray(ev.artist_ids) && ev.artist_ids.length > 0) {
            ev.artist_ids.forEach((aid: number) => { count[aid] = (count[aid] || 0) + 1; });
          } else if (ev.artist_id) {
            count[ev.artist_id] = (count[ev.artist_id] || 0) + 1;
          }
        });
        setConcertCount(count);
      })
      .catch(() => {});
  };

  const fetchArtists = () => {
    setLoading(true);
    artistService.getAll()
      .then((d) => setArtists(d?.data || d?.artists || d || []))
      .catch(() => showToast('Gagal memuat data artis', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArtists();
    fetchConcerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) =>
      a.name?.toLowerCase().includes(q) ||
      a.genre?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q)
    );
  }, [artists, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await artistService.delete(deleting.id);
      setDeleting(null);
      showToast('Artis berhasil dihapus');
      fetchArtists();
      fetchConcerts();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Gagal menghapus artis', 'error');
    } finally {
      setBusy(false);
    }
  };

  const actionBtns = (a: Artist) => (
    <div className="cadmin-artist-actions">
      <button className="cadmin-icon-btn" title="Lihat detail" onClick={() => { setCurrent(a); setModalMode('view'); }}><EyeIcon /></button>
      <button className="cadmin-icon-btn" title="Edit" onClick={() => { setCurrent(a); setModalMode('edit'); }}><EditIcon /></button>
      <button className="cadmin-icon-btn danger" title="Hapus" onClick={() => setDeleting(a)}><TrashSmallIcon /></button>
    </div>
  );

  const emptyLabel = search
    ? 'Tidak ada artis yang cocok dengan pencarian'
    : 'Belum ada artis. Tambahkan artis pertama Anda.';

  return (
    <div className="cadmin-page">
      <style>{styles}</style>
      <UiStyles />

      <div className="cadmin-head">
        <div>
          <h1 className="cadmin-h1">Penyanyi / Artis</h1>
          <p className="cadmin-sub">Manage singers and music groups.</p>
        </div>
        <button className="cadmin-btn-primary" onClick={() => { setCurrent(null); setModalMode('add'); }}>
          <PlusIcon /> Add Artist
        </button>
      </div>

      <div className="cadmin-card">
        <div className="cadmin-toolbar" style={{ marginBottom: 18 }}>
          <div className="cadmin-search">
            <SearchIcon />
            <input
              className="cadmin-input"
              placeholder="Search artist or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="cadmin-view-toggle">
            <button className={`cadmin-view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} title="Grid view"><GridIcon /></button>
            <button className={`cadmin-view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="List view"><ListIcon /></button>
          </div>
        </div>

        {loading ? (
          <div className="cadmin-loading">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="cadmin-empty">
            <div className="cadmin-empty-icon"><MicIcon /></div>
            <div className="cadmin-empty-title">{search ? 'Artis tidak ditemukan' : 'Belum ada artis'}</div>
            <div className="cadmin-empty-text">{emptyLabel}</div>
          </div>
        ) : view === 'grid' ? (
          <div className="cadmin-artist-grid">
            {filtered.map((a) => (
              <div className="cadmin-artist-card" key={a.id}>
                <div className="cadmin-artist-top">
                  {a.photo ? (
                    <img
                      className="cadmin-artist-photo"
                      src={imgUrl(a.photo)}
                      alt={a.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = placeholder(a.name.slice(0, 1).toUpperCase()); }}
                    />
                  ) : (
                    <div className="cadmin-artist-initial">{a.name.slice(0, 1).toUpperCase()}</div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="cadmin-artist-name">{a.name}</div>
                    {a.genre && <span className="cadmin-artist-genre">{a.genre}</span>}
                  </div>
                </div>
                <p className="cadmin-artist-desc">{a.description || 'Belum ada deskripsi.'}</p>
                <div className="cadmin-artist-foot">
                  <span className="cadmin-artist-count">{concertCount[a.id] ?? 0} concert{(concertCount[a.id] ?? 0) === 1 ? '' : 's'}</span>
                  {actionBtns(a)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cadmin-table-wrap">
            <table className="cadmin-table">
              <thead>
                <tr><th>Artist</th><th>Genre</th><th>Deskripsi</th><th>Concerts</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {a.photo ? (
                          <img
                            className="cadmin-artist-photo"
                            style={{ width: 38, height: 38, borderRadius: 9 }}
                            src={imgUrl(a.photo)}
                            alt={a.name}
                            onError={(e) => { (e.target as HTMLImageElement).src = placeholder(a.name.slice(0, 1).toUpperCase()); }}
                          />
                        ) : (
                          <div className="cadmin-artist-initial" style={{ width: 38, height: 38, borderRadius: 9, fontSize: 14 }}>{a.name.slice(0, 1).toUpperCase()}</div>
                        )}
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>{a.name}</span>
                      </div>
                    </td>
                    <td>{a.genre || '-'}</td>
                    <td style={{ color: '#94a3b8', whiteSpace: 'normal', maxWidth: 360 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.description || '-'}
                      </span>
                    </td>
                    <td>{concertCount[a.id] ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="cadmin-artist-actions" style={{ justifyContent: 'flex-end' }}>{actionBtns(a)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode === 'add' || modalMode === 'edit' ? (
        <ArtistForm
          mode={modalMode}
          artist={current}
          onClose={() => setModalMode(null)}
          onSaved={() => {
            setModalMode(null);
            showToast(modalMode === 'add' ? 'Artis berhasil ditambahkan' : 'Artis berhasil diperbarui');
            fetchArtists();
            fetchConcerts();
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      ) : null}

      {modalMode === 'view' && current ? (
        <AdminModal
          title={current.name}
          subtitle="Detail artis"
          onClose={() => setModalMode(null)}
          maxWidth={460}
          footer={
            <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={() => setModalMode(null)}>
              Close
            </button>
          }
        >
          <div className="cadmin-detail-grid">
            {current.photo ? (
              <img
                className="cadmin-detail-photo"
                src={imgUrl(current.photo)}
                alt={current.name}
                onError={(e) => { (e.target as HTMLImageElement).src = placeholder(current.name.slice(0, 1).toUpperCase()); }}
              />
            ) : (
              <div className="cadmin-artist-initial" style={{ width: 120, height: 120, fontSize: 40, borderRadius: 14 }}>{current.name.slice(0, 1).toUpperCase()}</div>
            )}
            <div style={{ minWidth: 0 }}>
              {current.genre && <span className="cadmin-artist-genre">{current.genre}</span>}
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, marginTop: 10, marginBottom: 10 }}>
                {current.description || 'Belum ada deskripsi.'}
              </p>
              <span className="cadmin-artist-count">
                {concertCount[current.id] ?? 0} concert{(concertCount[current.id] ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Hapus artist ini?"
          message={
            <>
              Artist <strong>{deleting.name}</strong> beserta konser dan data pesanan terkait akan dihapus
              permanen. Tindakan ini tidak dapat dibatalkan.
            </>
          }
          confirmLabel="Hapus Artist"
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
   Form tambah/edit artist (modal)
   ============================================================ */
function ArtistForm({ mode, artist, onClose, onSaved, onError }: {
  mode: 'add' | 'edit';
  artist: Artist | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(artist?.name ?? '');
  const [genre, setGenre] = useState(artist?.genre ?? '');
  const [description, setDescription] = useState(artist?.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(artist?.photo ? imgUrl(artist.photo) : '');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const genreOptions = artist?.genre && !GENRE_OPTIONS.includes(artist.genre)
    ? [artist.genre, ...GENRE_OPTIONS]
    : GENRE_OPTIONS;

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!name.trim()) {
      setErr('Nama artist wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('genre', genre.trim());
      fd.append('description', description.trim());
      if (file) fd.append('photo', file);

      if (mode === 'add') await artistService.create(fd);
      else await artistService.update(artist!.id, fd);
      onSaved();
    } catch (ex: any) {
      const msg = ex?.response?.data?.message || 'Gagal menyimpan artist';
      setErr(msg);
      onError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title={mode === 'add' ? 'Add Artist' : 'Edit Artist'}
      subtitle="Artist information shown in the mobile app."
      onClose={onClose}
      maxWidth={640}
      footer={
        <>
          <button type="button" className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="artist-form" className="cadmin-ui-btn cadmin-ui-btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : mode === 'add' ? 'Add Artist' : 'Save Changes'}
          </button>
        </>
      }
    >
      {err ? <div className="cadmin-ui-error">{err}</div> : null}

      <form id="artist-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="cadmin-photo-grid">
          <div className="cadmin-ui-field">
            <label className="cadmin-ui-label">Artist Photo</label>
            <div className="cadmin-ui-upload" onClick={() => inputRef.current?.click()}>
              {preview ? (
                <img className="cadmin-ui-upload-preview" src={preview} alt="Preview" />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="cadmin-ui-field">
              <label className="cadmin-ui-label" htmlFor="artist-name">Artist Name</label>
              <input
                id="artist-name"
                className="cadmin-ui-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Singer or group name"
                autoFocus
              />
            </div>
            <div className="cadmin-ui-field">
              <label className="cadmin-ui-label" htmlFor="artist-genre">Music Genre</label>
              <select
                id="artist-genre"
                className="cadmin-ui-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="">Pilih genre musik</option>
                {genreOptions.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="cadmin-ui-field">
          <label className="cadmin-ui-label" htmlFor="artist-desc">Description</label>
          <textarea
            id="artist-desc"
            className="cadmin-ui-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short artist biography"
          />
        </div>
      </form>
    </AdminModal>
  );
}
