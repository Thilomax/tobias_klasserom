import { useState } from 'react';
import { useStore } from './hooks/useStore.js';
import ClassroomCanvas from './components/ClassroomCanvas.jsx';
import StudentList from './components/StudentList.jsx';
import SessionHistory from './components/SessionHistory.jsx';
import ClassList from './components/ClassList.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { getConflictCount } from './utils/seating.js';
import { computeGroups } from './utils/layout.js';

const TAB_STUDENTS = 'students';
const TAB_HISTORY = 'history';
const TAB_CLASSES = 'classes';

export default function App() {
  const store = useStore();
  const [tab, setTab] = useState(TAB_STUDENTS);
  const [showSettings, setShowSettings] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [tool, setTool] = useState('draw');

  const groups = computeGroups(store.desks);
  const conflictCount = store.assignment
    ? getConflictCount(store.assignment, groups, store.sessions)
    : 0;

  function handleAssign() {
    setAssigning(true);
    setTimeout(() => { store.doAssignSeats(); setAssigning(false); }, 20);
  }

  function handleSaveSettings(newSettings) {
    store.resetLayout(newSettings);
    setShowSettings(false);
  }

  const totalDesks = store.desks.length;
  const desksFilled = store.assignment ? Object.keys(store.assignment).length : 0;

  const tabs = [
    { id: TAB_STUDENTS, label: 'Elever' },
    { id: TAB_CLASSES, label: `Klasser${store.classes.length ? ` (${store.classes.length})` : ''}` },
    { id: TAB_HISTORY, label: `Historikk${store.sessions.length ? ` (${store.sessions.length})` : ''}` },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: 300,
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: 20, fontWeight: 700, color: 'var(--text)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: '-0.02em',
              }}>Klasserom</h1>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                {store.activeClass
                  ? <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{store.activeClass.name}</span>
                  : 'Ingen aktiv klasse'
                }
                {' · '}{totalDesks} pulter
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              title="Innstillinger"
              style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-secondary)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 15, transition: 'background var(--transition)',
              }}
            >⚙</button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--surface-secondary)',
            borderRadius: 'var(--radius-sm)', padding: 3, gap: 2,
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6,
                  fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: tab === t.id ? 'var(--surface)' : 'transparent',
                  color: tab === t.id ? 'var(--text)' : 'var(--text-secondary)',
                  boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition)',
                }}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1, padding: '14px 20px',
          display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto',
        }}>
          {tab === TAB_STUDENTS && (
            <StudentList
              students={store.students}
              assignment={store.assignment}
              onAdd={store.addStudent}
              onRemove={store.removeStudent}
            />
          )}
          {tab === TAB_CLASSES && (
            <ClassList
              classes={store.classes}
              activeClassId={store.activeClassId}
              students={store.students}
              onSave={(name) => { store.saveClass(name); setTab(TAB_STUDENTS); }}
              onUpdate={store.updateClass}
              onLoad={(id) => { store.loadClass(id); setTab(TAB_STUDENTS); }}
              onDelete={store.deleteClass}
            />
          )}
          {tab === TAB_HISTORY && (
            <SessionHistory
              sessions={store.sessions}
              students={store.students}
              onDelete={store.deleteSession}
              onDeleteAll={store.clearAllSessions}
              onLoad={(id) => { store.loadSession(id); setTab(TAB_STUDENTS); }}
            />
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)', flexShrink: 0,
        }}>
          <button
            className="btn-primary"
            onClick={handleAssign}
            disabled={store.students.length === 0 || assigning}
            style={{ minWidth: 136 }}
          >
            {assigning ? 'Fordeler…' : store.assignment ? '↺  Fordel på nytt' : 'Fordel elever'}
          </button>

          {store.assignment ? (
            <>
              <button className="btn-secondary" onClick={store.saveSession} style={{ minWidth: 100 }}>
                Lagre økt
              </button>
              <button className="btn-ghost" onClick={store.clearAssignment}
                style={{ color: 'var(--text-secondary)' }}>
                Nullstill
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => store.resetLayout()}
                title="Tilbakestill til standard layout"
                style={{ padding: '6px 10px' }}
              >↺</button>

              <div style={{
                display: 'flex', background: 'var(--surface-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                padding: 3, gap: 2,
              }}>
                {[
                  { id: 'draw', label: 'Tegn', title: 'Dra over tomme celler for å plassere pulter' },
                  { id: 'erase', label: 'Slett', title: 'Dra over pulter for å fjerne dem' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    title={t.title}
                    style={{
                      padding: '5px 14px', borderRadius: 6,
                      fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                      background: tool === t.id ? 'var(--surface)' : 'transparent',
                      color: tool === t.id
                        ? (t.id === 'erase' ? 'var(--danger)' : 'var(--text)')
                        : 'var(--text-secondary)',
                      boxShadow: tool === t.id ? 'var(--shadow-sm)' : 'none',
                      transition: 'all var(--transition)',
                    }}
                  >{t.label}</button>
                ))}
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            {store.assignment ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {desksFilled} / {Math.min(store.students.length, totalDesks)} plassert
                </div>
                {store.sessions.length > 0 && (
                  <div style={{
                    fontSize: 12, marginTop: 1,
                    color: conflictCount === 0 ? 'var(--success)' : 'var(--warning)',
                  }}>
                    {conflictCount === 0
                      ? '✓ Ingen gjentakelser'
                      : `${conflictCount} gjentakelse${conflictCount !== 1 ? 'r' : ''}`}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                {store.students.length === 0
                  ? 'Legg til elever for å starte'
                  : 'Dra for å tegne · Hover for å slette'}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{
          flex: 1, overflow: 'auto', padding: 28,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        }}>
          <ClassroomCanvas
            desks={store.desks}
            students={store.students}
            assignment={store.assignment}
            tool={tool}
            onAddDeskAt={store.addDeskAt}
            onDeskMove={store.moveDeskToCell}
            onSwap={store.swapStudents}
            onRemoveDesk={store.removeDesk}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          settings={store.settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
