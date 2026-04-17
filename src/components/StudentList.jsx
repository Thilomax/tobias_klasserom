import { useState } from 'react';

export default function StudentList({ students, assignment, onAdd, onRemove }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const ok = onAdd(input);
    if (ok === false) {
      setError('Eleven finnes allerede');
      return;
    }
    setInput('');
    setError('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd(e);
  }

  const assignedIds = new Set(Object.values(assignment || {}));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="Legg til elev…"
          maxLength={40}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={!input.trim()}
          style={{ whiteSpace: 'nowrap' }}
        >
          Legg til
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -6 }}>{error}</div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        {students.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 13,
            padding: '24px 0',
          }}>
            Ingen elever enda
          </div>
        ) : (
          students.map((student, i) => {
            const seated = assignedIds.has(student.id);
            return (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 10px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  transition: 'background var(--transition)',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: seated
                    ? 'var(--success)'
                    : `hsl(${(i * 47) % 360}, 55%, 75%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: seated ? '#fff' : 'rgba(0,0,0,0.6)',
                  flexShrink: 0,
                }}>
                  {seated ? '✓' : student.name[0].toUpperCase()}
                </div>
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {student.name}
                </span>
                <button
                  className="btn-danger"
                  onClick={() => onRemove(student.id)}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  Fjern
                </button>
              </div>
            );
          })
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0 0',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-tertiary)',
        fontSize: 12,
      }}>
        <span>{students.length} elever</span>
        {assignment && (
          <span style={{ color: 'var(--success)' }}>
            {Object.keys(assignment).length} plassert
          </span>
        )}
      </div>
    </div>
  );
}
