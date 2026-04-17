import { useState } from 'react';

export default function ClassList({ classes, activeClassId, students, onSave, onUpdate, onLoad, onDelete }) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  function handleSave(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (classes.some(c => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('Klassenavn finnes allerede');
      return;
    }
    onSave(newName.trim());
    setNewName('');
    setError('');
  }

  const activeClass = classes.find(c => c.id === activeClassId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>

      {/* Save current students as new class */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 2 }}>
          Lagre nåværende elevliste
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave(e)}
            placeholder="Klassenavn, f.eks. 10A…"
            maxLength={30}
            style={{ flex: 1 }}
            disabled={students.length === 0}
          />
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!newName.trim() || students.length === 0}
          >
            Lagre
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
        {students.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Legg til elever først
          </div>
        )}
      </div>

      {/* Update active class */}
      {activeClass && (
        <button
          className="btn-secondary"
          onClick={onUpdate}
          style={{ fontSize: 13 }}
        >
          Oppdater «{activeClass.name}»
        </button>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Lagrede klasser
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
          {classes.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '12px 0', textAlign: 'center' }}>
              Ingen lagrede klasser
            </div>
          ) : (
            classes.map(cls => {
              const isActive = cls.id === activeClassId;
              return (
                <div
                  key={cls.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: isActive ? 'var(--accent-light)' : 'var(--surface)',
                    border: `1px solid ${isActive ? 'rgba(0,122,255,0.25)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {cls.name}
                      {isActive && (
                        <span style={{
                          fontSize: 10, fontWeight: 500,
                          marginLeft: 6, color: 'var(--accent)',
                          background: 'rgba(0,122,255,0.12)',
                          padding: '1px 5px', borderRadius: 4,
                        }}>Aktiv</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                      {cls.students.length} elever · {cls.sessions.length} økt{cls.sessions.length !== 1 ? 'er' : ''}
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      className="btn-ghost"
                      onClick={() => onLoad(cls.id)}
                      style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}
                    >
                      Bruk
                    </button>
                  )}
                  <button
                    className="btn-danger"
                    onClick={() => onDelete(cls.id)}
                    style={{ fontSize: 11, padding: '4px 8px' }}
                  >
                    Slett
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
