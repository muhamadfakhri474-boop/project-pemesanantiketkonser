import { useEffect, useState } from 'react';

/* =============================================================
   Komponen UI admin bersama: modal, dialog konfirmasi, toast.
   Semua class memakai prefix "cadmin-ui-".
   ============================================================= */

export function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function AlertIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function TrashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
    </svg>
  );
}

export function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const styles = `
.cadmin-ui-overlay {
  position: fixed; inset: 0; z-index: 120;
  background-color: rgba(3, 8, 18, 0.72);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  overflow-y: auto;
}
.cadmin-ui-modal {
  width: 100%;
  max-height: 90vh;
  display: flex; flex-direction: column;
  background-color: #1b2942;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  overflow: hidden;
}
.cadmin-ui-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  flex-shrink: 0;
}
.cadmin-ui-title { font-size: 19px; font-weight: 800; color: #f8fafc; margin: 0; letter-spacing: -0.2px; }
.cadmin-ui-subtitle { font-size: 13px; color: #94a3b8; margin: 5px 0 0; line-height: 1.5; }
.cadmin-ui-close {
  width: 30px; height: 30px; flex-shrink: 0;
  border: none; border-radius: 8px;
  background: transparent; color: #94a3b8;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background-color 0.15s ease, color 0.15s ease;
}
.cadmin-ui-close:hover { background-color: rgba(148, 163, 184, 0.12); color: #ffffff; }

.cadmin-ui-body { padding: 22px 24px; overflow-y: auto; }
.cadmin-ui-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  background-color: #1b2942;
  flex-shrink: 0;
}

/* Form */
.cadmin-ui-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.cadmin-ui-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.cadmin-ui-label { font-size: 12.5px; font-weight: 700; color: #cbd5e1; }
.cadmin-ui-input, .cadmin-ui-select, .cadmin-ui-textarea {
  width: 100%; box-sizing: border-box;
  background-color: #0e1828;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 9px; color: #e2e8f0;
  font-family: inherit; font-size: 13.5px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.cadmin-ui-input, .cadmin-ui-select { height: 42px; padding: 0 12px; }
.cadmin-ui-select { cursor: pointer; }
.cadmin-ui-select option { background-color: #0e1828; color: #e2e8f0; }
.cadmin-ui-textarea { padding: 11px 12px; resize: vertical; min-height: 92px; line-height: 1.55; }
.cadmin-ui-input::placeholder, .cadmin-ui-textarea::placeholder { color: #64748b; }
.cadmin-ui-input:focus, .cadmin-ui-select:focus, .cadmin-ui-textarea:focus {
  border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
}

/* Upload box */
.cadmin-ui-upload {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; width: 100%; min-height: 172px;
  background-color: #16223a;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  color: #94a3b8; cursor: pointer; overflow: hidden;
  text-align: center; box-sizing: border-box;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.cadmin-ui-upload:hover { border-color: rgba(59, 130, 246, 0.55); background-color: #17253f; }
.cadmin-ui-upload-title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.cadmin-ui-upload-hint { font-size: 11.5px; color: #94a3b8; }
.cadmin-ui-upload-preview { width: 100%; height: 172px; object-fit: cover; display: block; }

/* Buttons */
.cadmin-ui-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  height: 42px; padding: 0 20px; border-radius: 9px;
  font-family: inherit; font-size: 13.5px; font-weight: 700;
  cursor: pointer; border: none;
  transition: background-color 0.15s ease, filter 0.15s ease;
}
.cadmin-ui-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.cadmin-ui-btn-primary { background-color: #3b82f6; color: #ffffff; }
.cadmin-ui-btn-primary:hover:not(:disabled) { background-color: #2563eb; }
.cadmin-ui-btn-neutral {
  background-color: #334155; color: #e2e8f0;
  border: 1px solid rgba(148, 163, 184, 0.16);
}
.cadmin-ui-btn-neutral:hover:not(:disabled) { background-color: #3f4d63; }
.cadmin-ui-btn-green { background-color: #22c55e; color: #ffffff; }
.cadmin-ui-btn-green:hover:not(:disabled) { background-color: #16a34a; }
.cadmin-ui-btn-danger { background-color: #ef4444; color: #ffffff; }
.cadmin-ui-btn-danger:hover:not(:disabled) { background-color: #dc2626; }
.cadmin-ui-btn-ghost {
  background-color: transparent; color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.22);
}
.cadmin-ui-btn-ghost:hover:not(:disabled) { background-color: rgba(148, 163, 184, 0.1); color: #ffffff; }

/* Confirm dialog */
.cadmin-ui-confirm {
  width: 100%; max-width: 470px;
  background-color: #1b2942;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 26px 26px 20px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
  box-sizing: border-box;
}
.cadmin-ui-confirm-icon {
  width: 42px; height: 42px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
}
.cadmin-ui-confirm-icon.green { background-color: rgba(34, 197, 94, 0.16); color: #22c55e; }
.cadmin-ui-confirm-icon.red { background-color: rgba(239, 68, 68, 0.14); color: #ef4444; }
.cadmin-ui-confirm-icon.blue { background-color: rgba(59, 130, 246, 0.16); color: #60a5fa; }
.cadmin-ui-confirm-title { font-size: 19px; font-weight: 800; color: #f8fafc; margin: 0; letter-spacing: -0.2px; }
.cadmin-ui-confirm-text { font-size: 14px; color: #94a3b8; line-height: 1.65; margin: 10px 0 0; }
.cadmin-ui-confirm-text strong { color: #e2e8f0; font-weight: 700; }
.cadmin-ui-confirm-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

/* Toast */
.cadmin-ui-toast {
  position: fixed; right: 24px; bottom: 24px; z-index: 200;
  display: flex; align-items: flex-start; gap: 10px;
  min-width: 260px; max-width: 380px;
  padding: 13px 16px;
  border-radius: 11px;
  font-size: 13px; font-weight: 600; line-height: 1.5;
  border: 1px solid transparent;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.45);
  animation: cadmin-ui-toast-in 0.18s ease;
}
@keyframes cadmin-ui-toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.cadmin-ui-toast.success {
  background-color: #142c22; color: #4ade80;
  border-color: rgba(34, 197, 94, 0.35);
}
.cadmin-ui-toast.error {
  background-color: #2c1618; color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}
.cadmin-ui-toast.info {
  background-color: #16233a; color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.25);
}

/* Detail sections (order / payment) */
.cadmin-ui-section { margin-top: 20px; }
.cadmin-ui-section:first-child { margin-top: 0; }
.cadmin-ui-section-label { font-size: 12.5px; font-weight: 600; color: #94a3b8; margin: 0 0 9px; }
.cadmin-ui-box {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  overflow: hidden;
  background-color: #16233a;
}
.cadmin-ui-box-row { display: grid; grid-template-columns: 1fr 1fr; }
.cadmin-ui-box-row + .cadmin-ui-box-row { border-top: 1px solid rgba(148, 163, 184, 0.14); }
.cadmin-ui-cell { padding: 12px 14px; min-width: 0; }
.cadmin-ui-cell + .cadmin-ui-cell { border-left: 1px solid rgba(148, 163, 184, 0.14); }
.cadmin-ui-cell-label { font-size: 11.5px; color: #94a3b8; }
.cadmin-ui-cell-value { font-size: 13.5px; font-weight: 700; color: #f8fafc; margin-top: 5px; word-break: break-word; }
.cadmin-ui-cell-value.muted { color: #cbd5e1; font-weight: 600; }

/* Pill */
.cadmin-ui-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 700;
  padding: 4px 11px; border-radius: 999px; white-space: nowrap;
}
.cadmin-ui-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background-color: currentColor; }
.cadmin-ui-pill.pending { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.cadmin-ui-pill.paid, .cadmin-ui-pill.approved { background-color: rgba(34, 197, 94, 0.16); color: #22c55e; }
.cadmin-ui-pill.rejected { background-color: rgba(239, 68, 68, 0.14); color: #ef4444; }
.cadmin-ui-pill.gray { background-color: rgba(148, 163, 184, 0.14); color: #94a3b8; }

.cadmin-ui-error {
  padding: 10px 12px; margin-bottom: 14px;
  border-radius: 9px;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #fca5a5; font-size: 12.5px; line-height: 1.5;
}

@media (max-width: 640px) {
  .cadmin-ui-overlay { padding: 12px; align-items: flex-start; }
  .cadmin-ui-modal { max-height: calc(100vh - 24px); }
  .cadmin-ui-head, .cadmin-ui-body, .cadmin-ui-foot { padding-left: 16px; padding-right: 16px; }
  .cadmin-ui-grid { grid-template-columns: 1fr; }
  .cadmin-ui-box-row { grid-template-columns: 1fr; }
  .cadmin-ui-cell + .cadmin-ui-cell {
    border-left: none;
    border-top: 1px solid rgba(148, 163, 184, 0.14);
  }
  .cadmin-ui-toast { left: 12px; right: 12px; bottom: 12px; min-width: 0; }
}
`;

export function UiStyles() {
  return <style>{styles}</style>;
}

interface AdminModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export function AdminModal({ title, subtitle, onClose, children, footer, maxWidth = 560 }: AdminModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cadmin-ui-overlay" onMouseDown={onClose}>
      <div
        className="cadmin-ui-modal"
        style={{ maxWidth }}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="cadmin-ui-head">
          <div>
            <h3 className="cadmin-ui-title">{title}</h3>
            {subtitle ? <p className="cadmin-ui-subtitle">{subtitle}</p> : null}
          </div>
          <button className="cadmin-ui-close" onClick={onClose} aria-label="Tutup">
            <XIcon />
          </button>
        </div>

        <div className="cadmin-ui-body">{children}</div>

        {footer ? <div className="cadmin-ui-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'green' | 'red' | 'blue';
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'blue',
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const btnClass =
    tone === 'green'
      ? 'cadmin-ui-btn-green'
      : tone === 'red'
        ? 'cadmin-ui-btn-danger'
        : 'cadmin-ui-btn-primary';

  return (
    <div className="cadmin-ui-overlay" onMouseDown={onCancel}>
      <div className="cadmin-ui-confirm" onMouseDown={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className={`cadmin-ui-confirm-icon ${tone}`}>
          {icon ?? <AlertIcon />}
        </div>
        <h3 className="cadmin-ui-confirm-title">{title}</h3>
        <p className="cadmin-ui-confirm-text">{message}</p>
        <div className="cadmin-ui-confirm-foot">
          <button className="cadmin-ui-btn cadmin-ui-btn-neutral" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className={`cadmin-ui-btn ${btnClass}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export type ToastTone = 'success' | 'error' | 'info';

export function AdminToast({ message, tone, onDone }: { message: string; tone: ToastTone; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`cadmin-ui-toast ${tone}`} role="status">
      {tone === 'success' ? (
        <CheckIcon size={17} />
      ) : tone === 'error' ? (
        <AlertIcon size={17} />
      ) : null}
      <span>{message}</span>
    </div>
  );
}

export function useAdminToast() {
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const showToast = (message: string, tone: ToastTone = 'success') => setToast({ message, tone });
  const clearToast = () => setToast(null);

  return { toast, showToast, clearToast };
}
