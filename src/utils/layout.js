export const CANVAS_W = 900;
export const CANVAS_H = 490;
export const GRID_COLS = 10;
export const GRID_ROWS = 7;
export const CELL_W = CANVAS_W / GRID_COLS; // 90
export const CELL_H = CANVAS_H / GRID_ROWS; // 70
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

// Groups = horizontal clusters of consecutive-column desks in the same row
export function computeGroups(desks) {
  const byRow = {};
  for (const desk of desks) {
    if (!byRow[desk.gridRow]) byRow[desk.gridRow] = [];
    byRow[desk.gridRow].push(desk);
  }

  const groups = [];
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
