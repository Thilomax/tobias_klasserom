function buildCoMatrix(sessions) {
  const co = {};
  for (const session of sessions) {
    const byGroup = {};
    for (const a of session.assignments) {
      if (!byGroup[a.groupId]) byGroup[a.groupId] = [];
      byGroup[a.groupId].push(a.studentId);
    }
    for (const students of Object.values(byGroup)) {
      for (let i = 0; i < students.length; i++) {
        for (let j = i + 1; j < students.length; j++) {
          const [a, b] = [students[i], students[j]];
          if (!co[a]) co[a] = {};
          if (!co[b]) co[b] = {};
          co[a][b] = (co[a][b] || 0) + 1;
          co[b][a] = (co[b][a] || 0) + 1;
        }
      }
    }
  }
  return co;
}

function score(groups, deskToGroup, deskToStudent, co) {
  const byGroup = {};
  for (const [deskId, studentId] of Object.entries(deskToStudent)) {
    const gid = deskToGroup[deskId];
    if (!byGroup[gid]) byGroup[gid] = [];
    byGroup[gid].push(studentId);
  }
  let s = 0;
  for (const students of Object.values(byGroup)) {
    for (let i = 0; i < students.length; i++) {
      for (let j = i + 1; j < students.length; j++) {
        s += co[students[i]]?.[students[j]] || 0;
      }
    }
  }
  return s;
}

export function assignSeats(students, groups, sessions) {
  const co = buildCoMatrix(sessions);
  const allDeskIds = groups.flatMap(g => g.deskIds);
  const eligible = [...students].slice(0, allDeskIds.length);

  const deskToGroup = {};
  for (const g of groups) {
    for (const did of g.deskIds) deskToGroup[did] = g.id;
  }

  // Initial random assignment
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const assignment = {};
  shuffled.forEach((s, i) => {
    if (allDeskIds[i]) assignment[allDeskIds[i]] = s.id;
  });

  let currentScore = score(groups, deskToGroup, assignment, co);
  let best = { ...assignment };
  let bestScore = currentScore;

  const keys = Object.keys(assignment);
  const STEPS = 12000;

  for (let step = 0; step < STEPS; step++) {
    if (bestScore === 0) break;

    const i = Math.floor(Math.random() * keys.length);
    const j = Math.floor(Math.random() * keys.length);
    if (i === j) continue;

    // Swap two students
    const tmp = assignment[keys[i]];
    assignment[keys[i]] = assignment[keys[j]];
    assignment[keys[j]] = tmp;

    const newScore = score(groups, deskToGroup, assignment, co);
    const T = Math.max(0.01, 1 - step / STEPS);

    if (newScore < currentScore || Math.random() < Math.exp((currentScore - newScore) / T)) {
      currentScore = newScore;
      if (newScore < bestScore) {
        bestScore = newScore;
        best = { ...assignment };
      }
    } else {
      // Revert swap
      const tmp2 = assignment[keys[i]];
      assignment[keys[i]] = assignment[keys[j]];
      assignment[keys[j]] = tmp2;
    }
  }

  return best;
}

export function getConflictCount(assignment, groups, sessions) {
  const co = buildCoMatrix(sessions);
  const deskToGroup = {};
  for (const g of groups) {
    for (const did of g.deskIds) deskToGroup[did] = g.id;
  }
  return score(groups, deskToGroup, assignment, co);
}
