import { useState, useRef, useEffect } from 'react';

export default function RoomTemplateMenu({ roomTemplates, deskCount, onSaveTemplate, onLoadTemplate, onDeleteTemplate }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handleSave(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (roomTemplates.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Malnavn finnes allerede');
      return;
    }
    onSaveTemplate(trimmed);
    setName('');
    setError('');
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn-secondary"
        onClick={() => setOpen(o => !o)}
        title="Lagre eller last inn en klasseromslayout"
        style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
      >
        Layout <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          width: 300, background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          padding: 14, zIndex: 100,
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Lagre nåværende layout som mal
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSave(e)}
              placeholder="Malnavn…"
              maxLength={30}
              style={{ flex: 1, fontSize: 13 }}
              disabled={deskCount === 0}
            />
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!name.trim() || deskCount === 0}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              Lagre
            </button>
          </div>
          {error && <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>{error}</div>}

          <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0 8px' }} />

          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Lagrede layouter
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
            {roomTemplates.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '6px 0', textAlign: 'center' }}>
                Ingen lagrede layouter
              </div>
            ) : (
              roomTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 8px', background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {tpl.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {tpl.desks.length} pulter
                    </div>
                  </div>
                  <button
                    className="btn-ghost"
                    onClick={() => { onLoadTemplate(tpl.id); setOpen(false); }}
                    style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }}
                  >
                    Bruk
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => onDeleteTemplate(tpl.id)}
                    style={{ fontSize: 10, padding: '3px 6px' }}
                  >
                    Slett
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
