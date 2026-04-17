import { useRef, useState, useCallback } from 'react';
import {
  CANVAS_W, CANVAS_H, CELL_W, CELL_H,
  cellToXY, mouseToCell,
} from '../utils/layout.js';
import Desk from './Desk.jsx';

export default function ClassroomCanvas({
  desks, students, assignment, tool,
  onAddDeskAt, onDeskMove, onSwap, onRemoveDesk,
}) {
  const canvasRef = useRef(null);
  const dragState = useRef(null);
  // dragState: { mode: 'move'|'draw'|'erase', deskId?, visited: Set<string> }

  const [swapSource, setSwapSource] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);

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
  }, [desks, assignment, tool, swapSource, onSwap, onAddDeskAt, onRemoveDesk, getCell]);

  const handleMouseMove = useCallback((e) => {
    if (!dragState.current || assignment) return;
    const { gridCol, gridRow } = getCell(e);
    const cellKey = `${gridCol},${gridRow}`;
    const { mode, visited } = dragState.current;

    if (mode === 'move') {
      setDragPreview(prev => prev ? { ...prev, targetCol: gridCol, targetRow: gridRow } : prev);
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
      : 'crosshair';

  return (
    <div style={{ overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
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
        {/* Blackboard */}
        <div style={{
          position: 'absolute',
          top: 9, left: '50%', transform: 'translateX(-50%)',
          width: 180, height: 16,
          background: '#2D5A3D', borderRadius: 4, opacity: 0.45,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 9, color: 'white', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Tavle
          </span>
        </div>

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
              isDragging={isDragging}
              isBeingSwapped={isBeingSwapped}
              hasAssignment={!!assignment}
              onRemove={(e) => { e.stopPropagation(); onRemoveDesk(desk.id); }}
            />
          );
        })}

        {assignment && swapSource && (
          <div style={{
            position: 'absolute',
            bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            fontSize: 12, padding: '4px 12px', borderRadius: 100,
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            Klikk en annen pult for å bytte
          </div>
        )}
      </div>
    </div>
  );
}
