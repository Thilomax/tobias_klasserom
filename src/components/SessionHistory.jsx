export default function SessionHistory({ sessions, students, onDelete, onLoad }) {
  if (sessions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: 'var(--text-tertiary)',
        fontSize: 13,
        padding: '24px 0',
      }}>
        Ingen tidligere økter
      </div>
    );
  }

  const studentMap = {};
  for (const s of students) studentMap[s.id] = s;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
      {sessions.map(session => {
        const groupMap = {};
        for (const a of session.assignments) {
          if (!groupMap[a.groupId]) groupMap[a.groupId] = [];
          const s = studentMap[a.studentId];
          if (s) groupMap[a.groupId].push(s.name.split(' ')[0]);
        }
        const groupCount = Object.keys(groupMap).length;

        return (
          <div
            key={session.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {session.date}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {session.assignments.length} elever, {groupCount} grupper
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn-ghost"
                  onClick={() => onLoad(session.id)}
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  Vis
                </button>
                <button
                  className="btn-danger"
                  onClick={() => onDelete(session.id)}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  Slett
                </button>
              </div>
            </div>

            <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {Object.entries(groupMap).slice(0, 5).map(([gid, names]) => (
                <div
                  key={gid}
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '3px 7px',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {names.join(', ')}
                </div>
              ))}
              {Object.keys(groupMap).length > 5 && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  padding: '3px 4px',
                }}>
                  +{Object.keys(groupMap).length - 5} til
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
