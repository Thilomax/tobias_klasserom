import { useState } from 'react';

export default function SettingsModal({ settings, onSave, onClose }) {
  const [rows, setRows] = useState(settings.rows);
  const [desksPerGroup, setDesksPerGroup] = useState(settings.desksPerGroup);

  function handleSave() {
    const r = Math.max(1, Math.min(12, parseInt(rows) || 5));
    const d = Math.max(1, Math.min(6, parseInt(desksPerGroup) || 3));
    onSave({ rows: r, desksPerGroup: d });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: 340,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h3 style={{
          fontSize: 17,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}>
          Klasserom-oppsett
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Antall rader per kolonne
            </span>
            <input
              type="number"
              value={rows}
              onChange={e => setRows(e.target.value)}
              min={1} max={12}
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Pulter per gruppe (bredde)
            </span>
            <input
              type="number"
              value={desksPerGroup}
              onChange={e => setDesksPerGroup(e.target.value)}
              min={1} max={6}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div style={{
          background: 'var(--accent-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: 20,
          fontSize: 12,
          color: 'var(--accent)',
        }}>
          Dette vil tilbakestille pult-plasseringene.
          Totalt {rows * 2 * desksPerGroup} pulter i {rows * 2} grupper.
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Avbryt</button>
          <button className="btn-primary" onClick={handleSave}>Bruk</button>
        </div>
      </div>
    </div>
  );
}
