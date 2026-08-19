import { useState } from 'react';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewClassModal({ existingNames, onCreate, onClose }) {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [roster, setRoster] = useState([]);
  const [input, setInput] = useState('');
  const [studentError, setStudentError] = useState('');

  function handleAddStudent(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (roster.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setStudentError('Eleven finnes allerede');
      return;
    }
    setRoster(prev => [...prev, { id: makeId(), name: trimmed }]);
    setInput('');
    setStudentError('');
  }

  function handleRemoveStudent(id) {
    setRoster(prev => prev.filter(s => s.id !== id));
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Klassenavn finnes allerede');
      return;
    }
    onCreate(trimmed, roster);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          width: 380,
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <h3 style={{
          fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 20,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        }}>
          Ny klasse
        </h3>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            Klassenavn
          </span>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setNameError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="f.eks. 10A…"
            maxLength={30}
          />
          {nameError && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{nameError}</span>}
        </label>

        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Elever {roster.length > 0 && `(${roster.length})`}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setStudentError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleAddStudent(e)}
            placeholder="Legg til elev…"
            maxLength={40}
            style={{ flex: 1 }}
          />
          <button className="btn-secondary" onClick={handleAddStudent} disabled={!input.trim()}>
            Legg til
          </button>
        </div>
        {studentError && <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 8 }}>{studentError}</div>}

        <div style={{
          flex: 1, minHeight: 60, maxHeight: 220, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20,
        }}>
          {roster.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>
              Ingen elever lagt til enda
            </div>
          ) : (
            roster.map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px', background: 'var(--surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
                <button
                  className="btn-danger"
                  onClick={() => handleRemoveStudent(s.id)}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  Fjern
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Avbryt</button>
          <button className="btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            Opprett klasse
          </button>
        </div>
      </div>
    </div>
  );
}
