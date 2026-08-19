// One extra row/column of margin on every edge compared to the original room
export const GRID_COLS = 12;
export const GRID_ROWS = 9;
export const CELL_W = 90;
export const CELL_H = 70;
export const CANVAS_W = GRID_COLS * CELL_W;
export const CANVAS_H = GRID_ROWS * CELL_H;
export const DESK_W = 76;
export const DESK_H = 54;

export function cellToXY(gridCol, gridRow) {
  return {
    x: gridCol * CELL_W + (CELL_W - DESK_W) / 2,
    y: gridRow * CELL_H + (CELL_H - DESK_H) / 2,
  };
}

export function mouseToCell(mouseX, mouseY) {
  return {
    gridCol: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(mouseX / CELL_W))),
    gridRow: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(mouseY / CELL_H))),
  };
}

// Groups = horizontal clusters of consecutive-column desks in the same row,
// unless overridden by a manually defined group (e.g. a vertical cluster).
// Manually grouped desks are excluded from the automatic row clustering.
export function computeGroups(desks, manualGroups = []) {
  const deskIds = new Set(desks.map(d => d.id));
  const manualDeskIds = new Set();
  const groups = [];

  for (const g of manualGroups) {
    const ids = g.deskIds.filter(id => deskIds.has(id)).sort();
    if (ids.length < 2) continue;
    for (const id of ids) manualDeskIds.add(id);
    groups.push({ id: g.id, deskIds: ids });
  }

  const byRow = {};
  for (const desk of desks) {
    if (manualDeskIds.has(desk.id)) continue;
    if (!byRow[desk.gridRow]) byRow[desk.gridRow] = [];
    byRow[desk.gridRow].push(desk);
  }

  for (const rowDesks of Object.values(byRow)) {
    rowDesks.sort((a, b) => a.gridCol - b.gridCol);
    let cluster = [rowDesks[0]];
    for (let i = 1; i < rowDesks.length; i++) {
      if (rowDesks[i].gridCol === rowDesks[i - 1].gridCol + 1) {
        cluster.push(rowDesks[i]);
      } else {
        const ids = cluster.map(d => d.id).sort();
        groups.push({ id: ids.join('_'), deskIds: ids });
        cluster = [rowDesks[i]];
      }
    }
    const ids = cluster.map(d => d.id).sort();
    groups.push({ id: ids.join('_'), deskIds: ids });
  }
  return groups;
}

// Stable color per group id, used to outline manually defined groups
const GROUP_COLORS = ['#7C5CFC', '#E8590C', '#0CA678', '#1971C2', '#D6336C', '#F08C00', '#5F3DC4'];

export function colorForGroupId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

export function createDefaultDesks(rows = 5, desksPerGroup = 3) {
  const desks = [];
  let idx = 1;
  // Keep 1 empty cell on each side, 2-cell aisle in the middle
  const leftStart = 1;
  const rightStart = GRID_COLS - desksPerGroup - 1; // e.g. 10-3-1=6
  const rowOffset = Math.floor((GRID_ROWS - rows) / 2);

  for (let row = 0; row < rows; row++) {
    for (let d = 0; d < desksPerGroup; d++) {
      desks.push({ id: `d${idx++}`, gridCol: leftStart + d, gridRow: rowOffset + row });
    }
    for (let d = 0; d < desksPerGroup; d++) {
      desks.push({ id: `d${idx++}`, gridCol: rightStart + d, gridRow: rowOffset + row });
    }
  }
  return desks;
}

export function firstEmptyCell(desks) {
  const occupied = new Set(desks.map(d => `${d.gridCol},${d.gridRow}`));
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!occupied.has(`${col},${row}`)) return { gridCol: col, gridRow: row };
    }
  }
  return null;
}
