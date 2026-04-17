import { useState, useCallback, useEffect, useRef } from 'react';
import { createDefaultDesks, firstEmptyCell, computeGroups } from '../utils/layout.js';
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
  const [settings, setSettings] = useState({ rows: 5, desksPerGroup: 3 });
  const [classes, setClasses] = useState([]);
  const [activeClassId, setActiveClassId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const deskCounter = useRef(100);

  useEffect(() => {
    const saved = loadState(STORAGE_KEY);
    if (saved) {
      setStudents(saved.students || []);
      setDesks(saved.desks?.length ? saved.desks : createDefaultDesks(5, 3));
      setSessions(saved.sessions || []);
      setAssignment(saved.assignment || null);
      setSettings(saved.settings || { rows: 5, desksPerGroup: 3 });
      setClasses(saved.classes || []);
      setActiveClassId(saved.activeClassId || null);
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
      saveState(STORAGE_KEY, { students, desks, sessions, assignment, settings, classes, activeClassId });
    }, 300);
  }, [students, desks, sessions, assignment, settings, classes, activeClassId, initialized]);

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
    const groups = computeGroups(desks);
    setAssignment(assignSeats(students, groups, sessions));
  }, [students, desks, sessions]);

  const clearAssignment = useCallback(() => setAssignment(null), []);

  const saveSession = useCallback(() => {
    if (!assignment) return;
    const groups = computeGroups(desks);
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
    };
    setSessions(prev => [newSession, ...prev]);
    setAssignment(null);
  }, [assignment, desks]);

  const deleteSession = useCallback((id) => setSessions(prev => prev.filter(s => s.id !== id)), []);

  const loadSession = useCallback((sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const map = {};
    for (const a of session.assignments) map[a.deskId] = a.studentId;
    setAssignment(map);
  }, [sessions]);

  // ── Layout ────────────────────────────────────────────────────────────────
  const resetLayout = useCallback((newSettings) => {
    const s = newSettings || settings;
    setDesks(createDefaultDesks(s.rows, s.desksPerGroup));
    setAssignment(null);
    if (newSettings) setSettings(newSettings);
  }, [settings]);

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
    const snapshot = { id: makeId(), name: trimmed, students: [...students], sessions: [...sessions] };
    setClasses(prev => [...prev, snapshot]);
    setActiveClassId(snapshot.id);
    return true;
  }, [students, sessions]);

  const updateClass = useCallback(() => {
    if (!activeClassId) return;
    setClasses(prev => prev.map(c =>
      c.id === activeClassId ? { ...c, students: [...students], sessions: [...sessions] } : c
    ));
  }, [activeClassId, students, sessions]);

  const loadClass = useCallback((id) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    setStudents(cls.students);
    setSessions(cls.sessions);
    setAssignment(null);
    setActiveClassId(id);
  }, [classes]);

  const deleteClass = useCallback((id) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    if (activeClassId === id) setActiveClassId(null);
  }, [activeClassId]);

  const activeClass = classes.find(c => c.id === activeClassId) || null;

  return {
    students, desks, sessions, assignment, settings,
    classes, activeClassId, activeClass,
    addStudent, removeStudent,
    addDeskAt, removeDesk, moveDeskToCell,
    doAssignSeats, clearAssignment, saveSession, deleteSession, loadSession,
    resetLayout, swapStudents,
    saveClass, updateClass, loadClass, deleteClass,
  };
}
