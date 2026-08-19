import { useRef, useState, useCallback, useEffect } from 'react';
import {
  CANVAS_W, CANVAS_H, CELL_W, CELL_H, DESK_W, DESK_H,
  cellToXY, mouseToCell, colorForGroupId,
} from '../utils/layout.js';
import Desk from './Desk.jsx';

export default function ClassroomCanvas({
  desks, students, assignment, manualGroups, tool,
  onAddDeskAt, onDeskMove, onSwap, onRemoveDesk, onDefineGroup, onRemoveGroups,
}) {
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  // dragState: { mode: 'move'|'draw'|'erase', deskId?, visited: Set<string> }

  const [swapSource, setSwapSource] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => { setSelected(new Set()); }, [tool, assignment]);

  const studentMap = {};
  for (const s of students) studentMap[s.id] = s;

  // Find students whose first name is shared with at least one other student
  const firstNameCount = {};
  for (const s of students) {
    const fn = s.name.split(' ')[0];
    firstNameCount[fn] = (firstNameCount[fn] || 0) + 1;
  }
  const duplicateFirstNames = new Set(
    students.filter(s => firstNameCount[s.name.split(' ')[0]] > 1).map(s => s.id)
  );

  function getEffectiveCell(desk) {
    if (!dragPreview || dragPreview.mode !== 'move') {
      return { gridCol: desk.gridCol, gridRow: desk.gridRow };
    }
    if (desk.id === dragPreview.deskId) {
      return { gridCol: dragPreview.targetCol, gridRow: dragPreview.targetRow };
    }
    if (desk.gridCol === dragPreview.targetCol && desk.gridRow === dragPreview.targetRow) {
      const dragged = desks.find(d => d.id === dragPreview.deskId);
      if (dragged) return { gridCol: dragged.gridCol, gridRow: dragged.gridRow };
    }
    return { gridCol: desk.gridCol, gridRow: desk.gridRow };
  }

  const getCell = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return mouseToCell(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();

    const { gridCol, gridRow } = getCell(e);
    const cellKey = `${gridCol},${gridRow}`;
    const deskAtCell = desks.find(d => d.gridCol === gridCol && d.gridRow === gridRow);

    if (assignment) {
      if (!deskAtCell) return;
      if (swapSource === null) {
        setSwapSource(deskAtCell.id);
      } else if (swapSource === deskAtCell.id) {
        setSwapSource(null);
      } else {
        onSwap(swapSource, deskAtCell.id);
        setSwapSource(null);
      }
      return;
    }

    if (tool === 'group') {
      if (deskAtCell) {
        const adding = !selected.has(deskAtCell.id);
        setSelected(prev => {
          const next = new Set(prev);
          if (adding) next.add(deskAtCell.id); else next.delete(deskAtCell.id);
          return next;
        });
        dragState.current = { mode: 'group', groupAdding: adding, visited: new Set([cellKey]) };
      } else {
        setSelected(new Set());
      }
      return;
    }

    if (tool === 'erase') {
      if (deskAtCell) onRemoveDesk(deskAtCell.id);
      dragState.current = { mode: 'erase', visited: new Set([cellKey]) };
    } else {
      // draw tool
      if (deskAtCell) {
        dragState.current = { mode: 'move', deskId: deskAtCell.id, visited: new Set() };
        setDragPreview({ mode: 'move', deskId: deskAtCell.id, targetCol: gridCol, targetRow: gridRow });
      } else {
        onAddDeskAt(gridCol, gridRow);
        dragState.current = { mode: 'draw', visited: new Set([cellKey]) };
      }
    }
  }, [desks, assignment, tool, swapSource, selected, onSwap, onAddDeskAt, onRemoveDesk, getCell]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current || assignment) return;
    const { gridCol, gridRow } = getCell(e);
    const cellKey = `${gridCol},${gridRow}`;
    const { mode, visited } = dragState.current;

    if (mode === 'move') {
      setDragPreview(prev => prev ? { ...prev, targetCol: gridCol, targetRow: gridRow } : prev);
    } else if (mode === 'group') {
      if (!visited.has(cellKey)) {
        visited.add(cellKey);
        const desk = desks.find(d => d.gridCol === gridCol && d.gridRow === gridRow);
        if (desk) {
          const adding = dragState.current.groupAdding;
          setSelected(prev => {
            const next = new Set(prev);
            if (adding) next.add(desk.id); else next.delete(desk.id);
            return next;
          });
        }
      }
    } else if (mode === 'draw') {
      if (!visited.has(cellKey)) {
        visited.add(cellKey);
        onAddDeskAt(gridCol, gridRow);
      }
    } else if (mode === 'erase') {
      if (!visited.has(cellKey)) {
        visited.add(cellKey);
        const desk = desks.find(d => d.gridCol === gridCol && d.gridRow === gridRow);
        if (desk) onRemoveDesk(desk.id);
      }
    }
  }, [assignment, desks, onAddDeskAt, onRemoveDesk, getCell]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current) return;
    if (dragState.current.mode === 'move' && dragPreview) {
      onDeskMove(dragPreview.deskId, dragPreview.targetCol, dragPreview.targetRow);
    }
    dragState.current = null;
    setDragPreview(null);
  }, [dragPreview, onDeskMove]);

  const canvasCursor = assignment
    ? 'default'
    : tool === 'erase'
      ? 'cell'
      : tool === 'group'
        ? 'pointer'
        : 'crosshair';

  const touchedGroupIds = new Set(
    manualGroups.filter(g => g.deskIds.some(id => selected.has(id))).map(g => g.id)
  );

  return (
    <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* Blackboard — outside the room so desks can never be placed under it */}
        <div style={{
          width: 180, height: 16,
          background: '#2D5A3D', borderRadius: 4, opacity: 0.45,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9, color: 'white', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tavle
          </span>
        </div>

        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: CANVAS_W,
            height: CANVAS_H,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: '#FAFAFA',
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)`,
            backgroundSize: `${CELL_W}px ${CELL_H}px`,
            backgroundPosition: `${CELL_W / 2 - 0.5}px ${CELL_H / 2 - 0.5}px`,
            userSelect: 'none',
            cursor: canvasCursor,
            flexShrink: 0,
          }}
        >
        {manualGroups.flatMap(group => {
          const memberDesks = desks.filter(d => group.deskIds.includes(d.id));
          if (memberDesks.length < 2) return [];
          const color = colorForGroupId(group.id);
          // One highlight per member desk (not a bounding box) so an L-shaped
          // or otherwise non-rectangular group never visually swallows a
          // neighboring desk that isn't actually part of it.
          return memberDesks.map(d => {
            const eff = getEffectiveCell(d);
            const { x, y } = cellToXY(eff.gridCol, eff.gridRow);
            return (
              <div
                key={`${group.id}_${d.id}`}
                style={{
                  position: 'absolute',
                  left: x - 6, top: y - 6, width: DESK_W + 12, height: DESK_H + 12,
                  border: `2px dashed ${color}`,
                  borderRadius: 10,
                  background: `${color}14`,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            );
          });
        })}

        {desks.map(desk => {
          const eff = getEffectiveCell(desk);
          const { x, y } = cellToXY(eff.gridCol, eff.gridRow);
          const studentId = assignment?.[desk.id];
          const student = studentId ? studentMap[studentId] : null;
          const isDragging = dragPreview?.mode === 'move' && dragPreview?.deskId === desk.id;
          const isBeingSwapped = !isDragging && dragPreview?.mode === 'move' &&
            desk.gridCol === dragPreview.targetCol && desk.gridRow === dragPreview.targetRow;

          return (
            <Desk
              key={desk.id}
              x={x}
              y={y}
              student={student}
              tool={tool}
              hasDuplicate={student ? duplicateFirstNames.has(student.id) : false}
              isSwapSource={swapSource === desk.id}
              isSelected={tool === 'group' && selected.has(desk.id)}
              isDragging={isDragging}
              isBeingSwapped={isBeingSwapped}
              hasAssignment={!!assignment}
              onRemove={(e) => { e.stopPropagation(); onRemoveDesk(desk.id); }}
            />
          );
        })}

        </div>

        {/* Instruction/action pills — outside the room so desks can never sit under them */}
        {assignment && swapSource && (
          <div style={{
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 12, padding: '4px 12px', borderRadius: 100,
            whiteSpace: 'nowrap',
          }}>
            Klikk en annen pult for å bytte
          </div>
        )}

        {!assignment && tool === 'group' && selected.size > 0 && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.75)', color: '#fff',
              fontSize: 12, padding: '6px 8px 6px 12px', borderRadius: 100,
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            <span>{selected.size} pult{selected.size !== 1 ? 'er' : ''} valgt</span>
            {selected.size >= 2 && (
              <button
                onClick={() => { onDefineGroup([...selected]); setSelected(new Set()); }}
                style={{
                  border: 'none', borderRadius: 100, padding: '4px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: '#fff', color: '#111',
                }}
              >Definer gruppe</button>
            )}
            {touchedGroupIds.size > 0 && (
              <button
                onClick={() => { onRemoveGroups([...touchedGroupIds]); setSelected(new Set()); }}
                style={{
                  border: 'none', borderRadius: 100, padding: '4px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.18)', color: '#fff',
                }}
              >Fjern gruppe</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
