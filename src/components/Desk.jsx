import { useState } from 'react';
import { DESK_W, DESK_H } from '../utils/layout.js';

// Estimate if text fits within available pixel width
const TEXT_PX_PER_CHAR = 7.2; // at 13px font
const DESK_PADDING = 16;
const AVAILABLE = DESK_W - DESK_PADDING; // ~60px

function firstNameFontSize(name) {
  const est = name.length * TEXT_PX_PER_CHAR;
  if (est <= AVAILABLE) return 13;
  if (est <= AVAILABLE * 1.25) return 11;
  return 10;
}

function lastNameDisplay(lastName, hasDuplicate) {
  if (!lastName) return null;
  // At 10px, each char ≈ 6px
  const fits = lastName.length * 6 <= AVAILABLE;
  if (!fits && hasDuplicate) {
    // Must show at least initial to disambiguate
    return lastName[0].toUpperCase() + '.';
  }
  return lastName; // CSS ellipsis handles any remaining overflow
}

export default function Desk({
  x, y, student, tool, hasDuplicate,
  isSwapSource, isDragging, isBeingSwapped,
  hasAssignment, onRemove,
}) {
  const [hovered, setHovered] = useState(false);

  const highlighted = isSwapSource || isBeingSwapped;
  const showDelete = hovered && !hasAssignment && !isDragging && tool === 'draw';
  const eraseHover = hovered && !hasAssignment && tool === 'erase';

  const deskCursor = hasAssignment
    ? 'pointer'
    : tool === 'erase'
      ? 'cell'
      : isDragging ? 'grabbing' : 'grab';

  const firstName = student?.name.split(' ')[0] ?? null;
  const lastName = student ? student.name.split(' ').slice(1).join(' ') : null;
  const line2 = lastName ? lastNameDisplay(lastName, hasDuplicate) : null;
  const fnSize = firstName ? firstNameFontSize(firstName) : 13;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: DESK_W,
        height: DESK_H,
        background: eraseHover ? '#FFDDD9' : hovered && !hasAssignment ? '#E8E8E8' : '#EFEFEF',
        border: `2px solid ${
          highlighted ? 'var(--accent)' :
          eraseHover ? 'var(--danger)' :
          'rgba(0,0,0,0.1)'
        }`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: isDragging
          ? 'var(--shadow-lg)'
          : isSwapSource
            ? '0 0 0 3px rgba(0,122,255,0.2), var(--shadow-sm)'
            : 'var(--shadow-sm)',
        cursor: deskCursor,
        transition: isDragging
          ? 'none'
          : 'left 110ms ease, top 110ms ease, box-shadow 150ms, border-color 150ms, background 150ms',
        transform: isDragging ? 'scale(1.07)' : isSwapSource ? 'scale(1.04)' : 'scale(1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        zIndex: isDragging ? 100 : isSwapSource ? 50 : hovered ? 10 : 1,
      }}
    >
      {/* Chair */}
      <div style={{
        position: 'absolute',
        bottom: -7, left: '50%', transform: 'translateX(-50%)',
        width: 30, height: 7,
        background: 'rgba(0,0,0,0.08)',
        borderRadius: '0 0 5px 5px',
        pointerEvents: 'none',
      }} />

      {firstName ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: '100%', padding: '0 6px' }}>
          {/* First name — adaptive size, never ellipsed */}
          <div style={{
            fontSize: fnSize,
            fontWeight: 600,
            color: 'var(--text)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
          }}>
            {firstName}
          </div>

          {/* Last name line — shows when available or needed for disambiguation */}
          {line2 && (
            <div style={{
              fontSize: 10,
              color: 'var(--text-secondary)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
              width: '100%',
            }}>
              {line2}
            </div>
          )}
        </div>
      ) : (
        <div style={{ width: 18, height: 1.5, background: 'rgba(0,0,0,0.15)', borderRadius: 1 }} />
      )}

      {showDelete && (
        <button
          onMouseDown={onRemove}
          style={{
            position: 'absolute', top: -9, right: -9,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--danger)', color: '#fff',
            fontSize: 13, fontWeight: 700, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)', zIndex: 200,
            pointerEvents: 'all',
          }}
        >×</button>
      )}
    </div>
  );
}
