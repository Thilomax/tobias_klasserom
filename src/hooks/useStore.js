import { useState, useCallback, useEffect, useRef } from 'react';
import { createDefaultDesks, firstEmptyCell, computeGroups, nextGroupColorIndex } from '../utils/layout.js';
import { assignSeats } from '../utils/seating.js';
import { loadState, saveState } from '../utils/storage.js';

const STORAGE_KEY = 'klasserom_v3';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function useStore() {
  const [students, setStudents] = useState([]);
  const [desks, setDesks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [manualGroups, setManualGroups] = useState([]);
  const [settings, setSettings] = useState({ rows: 5, desksPerGroup: 3 });
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [roomTemplates, setRoomTemplates] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const deskCounter = useRef(100);

  // Replaces the room layout wholesale (used when restoring a session's,
  // class's, or template's saved desks) and keeps the id counter past
  // whatever ids the new layout brought with it, so new desks never collide.
  function applyDeskLayout(newDesks, newManualGroups) {
    setDesks(newDesks.map(d => ({ ...d })));
    setManualGroups((newManualGroups || []).map(g => ({ ...g })));
    const ids = newDesks.map(d => parseInt(d.id.replace('d', '')) || 0);
    deskCounter.current = Math.max(deskCounter.current, 100, ...(ids.length ? ids : [0])) + 1;
  }

  useEffect(() => {
    const saved = loadState(STORAGE_KEY);
    if (saved) {
      setStudents(saved.students || []);
      setDesks(saved.desks?.length ? saved.desks : createDefaultDesks(5, 3));
      setSessions(saved.sessions || []);
      setAssignment(saved.assignment || null);
      setManualGroups(saved.manualGroups || []);
      setSettings(saved.settings || { rows: 5, desksPerGroup: 3 });
      setClasses(saved.classes || []);
      setActiveClassId(saved.activeClassId || null);
      setRoomTemplates(saved.roomTemplates || []);
      const ids = (saved.desks || []).map(d => parseInt(d.id.replace('d', '')) || 0);
      deskCounter.current = Math.max(100, ...ids) + 1;
    } else {
      setDesks(createDefaultDesks(5, 3));
    }
    setInitialized(true);
  }, []);

  const saveTimeout = useRef(null);
  useEffect(() => {
    if (!initialized) return;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveState(STORAGE_KEY, { students, desks, sessions, assignment, manualGroups, settings, classes, activeClassId, roomTemplates });
    }, 300);
  }, [students, desks, sessions, assignment, manualGroups, settings, classes, activeClassId, roomTemplates, initialized]);

  // Keep the active class's stored roster/history/room layout in sync as
  // it's edited, so there's no separate manual "save"/"update" step while a
  // class is active — and the room always reopens the way it was last left
  // for that class.
  useEffect(() => {
    if (!initialized || !activeClassId) return;
    setClasses(prev => prev.map(c =>
      c.id === activeClassId ? { ...c, students, sessions, desks, manualGroups } : c
    ));
  }, [students, sessions, desks, manualGroups, activeClassId, initialized]);

  // ── Students ──────────────────────────────────────────────────────────────
  const addStudent = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    setStudents(prev => {
      if (prev.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, { id: makeId(), name: trimmed }];
    });
    return true;
  }, []);

  const removeStudent = useCallback((id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setAssignment(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === id) delete next[k];
      return Object.keys(next).length ? next : null;
    });
  }, []);

  // ── Desks ─────────────────────────────────────────────────────────────────
  const addDeskAt = useCallback((gridCol, gridRow) => {
    setDesks(prev => {
      if (prev.some(d => d.gridCol === gridCol && d.gridRow === gridRow)) return prev;
      const id = `d${deskCounter.current++}`;
      return [...prev, { id, gridCol, gridRow }];
    });
  }, []);

  const removeDesk = useCallback((id) => {
    setDesks(prev => prev.filter(d => d.id !== id));
    setAssignment(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[id];
      return Object.keys(next).length ? next : null;
    });
    setManualGroups(prev => prev
      .map(g => ({ ...g, deskIds: g.deskIds.filter(did => did !== id) }))
      .filter(g => g.deskIds.length >= 2));
  }, []);

  const moveDeskToCell = useCallback((id, gridCol, gridRow) => {
    setDesks(prev => {
      const occupant = prev.find(d => d.gridCol === gridCol && d.gridRow === gridRow && d.id !== id);
      if (occupant) {
        const moved = prev.find(d => d.id === id);
        return prev.map(d => {
          if (d.id === id) return { ...d, gridCol, gridRow };
          if (d.id === occupant.id) return { ...d, gridCol: moved.gridCol, gridRow: moved.gridRow };
          return d;
        });
      }
      return prev.map(d => d.id === id ? { ...d, gridCol, gridRow } : d);
    });
  }, []);

  // ── Seating ───────────────────────────────────────────────────────────────
  const doAssignSeats = useCallback(() => {
    if (students.length === 0) return;
    const groups = computeGroups(desks, manualGroups);
    setAssignment(assignSeats(students, groups, sessions));
  }, [students, desks, manualGroups, sessions]);

  const clearAssignment = useCallback(() => setAssignment(null), []);

  const saveSession = useCallback(() => {
    if (!assignment) return;
    const groups = computeGroups(desks, manualGroups);
    const groupByDesk = {};
    for (const g of groups) for (const did of g.deskIds) groupByDesk[did] = g.id;
    const list = Object.entries(assignment).map(([deskId, studentId]) => ({
      deskId, studentId, groupId: groupByDesk[deskId] || deskId,
    }));
    const newSession = {
      id: makeId(),
      date: new Date().toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      timestamp: Date.now(),
      assignments: list,
      // Snapshot the room as it looked for this session, so "Vis" can
      // restore it — otherwise a later-changed layout leaves the seating
      // pointing at desks that no longer exist where they used to.
      desks: desks.map(d => ({ ...d })),
      manualGroups: manualGroups.map(g => ({ ...g })),
    };
    setSessions(prev => [newSession, ...prev]);
    setAssignment(null);
  }, [assignment, desks, manualGroups]);

  const deleteSession = useCallback((id) => setSessions(prev => prev.filter(s => s.id !== id)), []);
  const clearAllSessions = useCallback(() => setSessions([]), []);

  const loadSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const map = {};
    for (const a of session.assignments) map[a.deskId] = a.studentId;
    // Older sessions saved before layout snapshots existed don't have
    // `desks` — fall back to leaving the current room layout untouched.
    if (session.desks) applyDeskLayout(session.desks, session.manualGroups);
    setAssignment(map);
  }, [sessions]);

  // ── Layout ────────────────────────────────────────────────────────────────
  const resetLayout = useCallback((newSettings) => {
    const s = newSettings || settings;
    setDesks(createDefaultDesks(s.rows, s.desksPerGroup));
    setAssignment(null);
    setManualGroups([]);
    if (newSettings) setSettings(newSettings);
  }, [settings]);

  // ── Room templates ────────────────────────────────────────────────────────
  const saveRoomTemplate = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const snapshot = {
      id: makeId(),
      name: trimmed,
      desks: desks.map(d => ({ ...d })),
      manualGroups: manualGroups.map(g => ({ ...g })),
    };
    setRoomTemplates(prev => [...prev, snapshot]);
    return true;
  }, [desks, manualGroups]);

  const loadRoomTemplate = useCallback((id) => {
    const tpl = roomTemplates.find(t => t.id === id);
    if (!tpl) return;
    applyDeskLayout(tpl.desks, tpl.manualGroups);
    setAssignment(null);
  }, [roomTemplates]);

  const deleteRoomTemplate = useCallback((id) => {
    setRoomTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Manual groups ─────────────────────────────────────────────────────────
  const defineManualGroup = useCallback((deskIds) => {
    if (deskIds.length < 2) return;
    setManualGroups(prev => {
      const idSet = new Set(deskIds);
      const cleaned = prev
        .map(g => ({ ...g, deskIds: g.deskIds.filter(id => !idSet.has(id)) }))
        .filter(g => g.deskIds.length >= 2);
      const colorIndex = nextGroupColorIndex(cleaned);
      return [...cleaned, { id: `m${makeId()}`, deskIds: [...deskIds].sort(), colorIndex }];
    });
  }, []);

  const removeManualGroups = useCallback((groupIds) => {
    const idSet = new Set(groupIds);
    setManualGroups(prev => prev.filter(g => !idSet.has(g.id)));
  }, []);

  const swapStudents = useCallback((deskIdA, deskIdB) => {
    setAssignment(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const tmp = next[deskIdA];
      next[deskIdA] = next[deskIdB];
      next[deskIdB] = tmp;
      if (next[deskIdA] === undefined) delete next[deskIdA];
      if (next[deskIdB] === undefined) delete next[deskIdB];
      return next;
    });
  }, []);

  // ── Classes ───────────────────────────────────────────────────────────────
  const saveClass = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const snapshot = {
      id: makeId(), name: trimmed,
      students: [...students], sessions: [...sessions],
      desks: desks.map(d => ({ ...d })), manualGroups: manualGroups.map(g => ({ ...g })),
    };
    setClasses(prev => [...prev, snapshot]);
    setActiveClassId(snapshot.id);
    return true;
  }, [students, sessions, desks, manualGroups]);

  const loadClass = useCallback((id) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    setStudents(cls.students);
    setSessions(cls.sessions);
    setAssignment(null);
    setActiveClassId(id);
    // Older classes saved before layout snapshots existed don't have
    // `desks` — fall back to leaving the current room layout untouched.
    if (cls.desks) applyDeskLayout(cls.desks, cls.manualGroups);
  }, [classes]);

  const deleteClass = useCallback((id) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    if (activeClassId === id) setActiveClassId(null);
  }, [activeClassId]);

  // Creates and activates a class from a roster assembled up front (see
  // NewClassModal), rather than editing the currently active class's roster
  // in place — so it always starts with its own blank history, and can
  // never inherit whatever an unrelated previously-active class had saved.
  const startNewClass = useCallback((name, roster = []) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const snapshot = {
      id: makeId(), name: trimmed,
      students: [...roster], sessions: [],
      desks: desks.map(d => ({ ...d })), manualGroups: manualGroups.map(g => ({ ...g })),
    };
    setClasses(prev => [...prev, snapshot]);
    setStudents([...roster]);
    setAssignment(null);
    setSessions([]);
    setActiveClassId(snapshot.id);
    return true;
  }, [desks, manualGroups]);

  const activeClass = classes.find(c => c.id === activeClassId) || null;

  return {
    students, desks, sessions, assignment, manualGroups, settings,
    classes, activeClassId, activeClass, roomTemplates,
    addStudent, removeStudent,
    addDeskAt, removeDesk, moveDeskToCell,
    doAssignSeats, clearAssignment, saveSession, deleteSession, clearAllSessions, loadSession,
    resetLayout, swapStudents,
    defineManualGroup, removeManualGroups,
    saveClass, loadClass, deleteClass, startNewClass,
    saveRoomTemplate, loadRoomTemplate, deleteRoomTemplate,
  };
}
