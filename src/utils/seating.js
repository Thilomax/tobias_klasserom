// ── Pair tracking ─────────────────────────────────────────────────────────────

function pairKey(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildUsedPairs(sessions) {
  const pairs = new Set();
  for (const session of sessions) {
    const byGroup = {};
    for (const { studentId, groupId } of session.assignments) {
      if (!byGroup[groupId]) byGroup[groupId] = [];
      byGroup[groupId].push(studentId);
    }
    for (const members of Object.values(byGroup)) {
      for (let i = 0; i < members.length; i++)
        for (let j = i + 1; j < members.length; j++)
          pairs.add(pairKey(members[i], members[j]));
    }
  }
  return pairs;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Lazy k-combinations generator — yields without pre-allocating all results
function* combos(arr, k) {
  if (k === 0) { yield []; return; }
  for (let i = 0; i <= arr.length - k; i++)
    for (const rest of combos(arr.slice(i + 1), k - 1))
      yield [arr[i], ...rest];
}

// ── Scoring ───────────────────────────────────────────────────────────────────

// Count pairs in the current assignment that have been together before
function scorePairs(groups, assignment, usedPairs) {
  let n = 0;
  for (const g of groups) {
    const members = g.deskIds.map(d => assignment[d]).filter(Boolean);
    for (let i = 0; i < members.length; i++)
      for (let j = i + 1; j < members.length; j++)
        if (usedPairs.has(pairKey(members[i], members[j]))) n++;
  }
  return n;
}

// ── Exact backtracking (CSP solver) ──────────────────────────────────────────
//
// Models the problem as: partition students into groups such that every pair
// in each group is "new" (hasn't appeared together in any previous session).
//
// Strategy:
//   1. Build an availability graph: edge (u,v) iff u and v have never been together
//   2. Find a triangle-partition of this graph covering all students
//   3. "Most constrained first": always pick the student with the fewest
//      available partners to reduce branching early
//   4. Prune immediately when a node has too few partners to fill a group
//   5. Randomise exploration order so repeated calls find different solutions

function tryExact(eligibleIds, groups, usedPairs, deadline) {
  // Availability adjacency: avail.get(id) = Set of ids this student can pair with
  const avail = new Map();
  for (const id of eligibleIds) {
    avail.set(id, new Set(
      eligibleIds.filter(o => o !== id && !usedPairs.has(pairKey(id, o)))
    ));
  }

  let timedOut = false;

  // Returns array of chosen-student-arrays per group, or null on failure
  function bt(remaining, gi) {
    if (Date.now() > deadline) { timedOut = true; return null; }
    if (gi >= groups.length) return remaining.length === 0 ? [] : null;

    const size = Math.min(groups[gi].deskIds.length, remaining.length);

    // Empty group (more groups than students): skip
    if (size === 0) {
      const sub = bt(remaining, gi + 1);
      return sub !== null ? [[], ...sub] : null;
    }

    // ── Most constrained first ──────────────────────────────────────────────
    // Count available partners within 'remaining' for each student
    let pivot = remaining[0], minDeg = Infinity;
    for (const id of remaining) {
      let deg = 0;
      for (const r of remaining) if (r !== id && avail.get(id).has(r)) deg++;
      if (deg < minDeg) { minDeg = deg; pivot = id; }
    }

    const others = remaining.filter(r => r !== pivot);
    // Shuffle for variety — different valid solutions across runs
    const candidates = shuffle(others.filter(r => avail.get(pivot).has(r)));

    // Prune: not enough candidates to fill this group
    if (candidates.length < size - 1) return null;

    for (const combo of combos(candidates, size - 1)) {
      // All pairs within combo must also be new to each other
      let allNew = true;
      check: for (let i = 0; i < combo.length; i++)
        for (let j = i + 1; j < combo.length; j++)
          if (!avail.get(combo[i]).has(combo[j])) { allNew = false; break check; }
      if (!allNew) continue;

      const sub = bt(others.filter(r => !combo.includes(r)), gi + 1);
      if (sub !== null) return [[pivot, ...combo], ...sub];
      if (timedOut) return null;
    }

    return null; // backtrack
  }

  const groupSets = bt(shuffle([...eligibleIds]), 0);
  if (timedOut || !groupSets) return null;

  // Map students to desks (random order within each group)
  const assignment = {};
  for (let gi = 0; gi < groups.length; gi++) {
    const chosen = shuffle(groupSets[gi] ?? []);
    groups[gi].deskIds.forEach((deskId, i) => {
      if (chosen[i]) assignment[deskId] = chosen[i];
    });
  }
  return assignment;
}

// ── SA fallback ───────────────────────────────────────────────────────────────
//
// Used when no perfect solution exists (e.g. round 15+, or very small class).
// Minimises the number of repeated pairs via simulated annealing.

function saAssign(eligible, groups, usedPairs) {
  const allDeskIds = groups.flatMap(g => g.deskIds);
  const shuffled = shuffle(eligible);
  const assignment = {};
  shuffled.forEach((s, i) => { if (allDeskIds[i]) assignment[allDeskIds[i]] = s.id; });

  let cur = scorePairs(groups, assignment, usedPairs);
  let best = { ...assignment }, bestScore = cur;
  const keys = Object.keys(assignment);

  for (let step = 0; step < 15000 && bestScore > 0; step++) {
    const i = (Math.random() * keys.length) | 0;
    const j = (Math.random() * keys.length) | 0;
    if (i === j) continue;

    [assignment[keys[i]], assignment[keys[j]]] = [assignment[keys[j]], assignment[keys[i]]];
    const s = scorePairs(groups, assignment, usedPairs);
    const T = Math.max(0.01, 1 - step / 15000);

    if (s <= cur || Math.random() < Math.exp((cur - s) / T)) {
      cur = s;
      if (s < bestScore) { bestScore = s; best = { ...assignment }; }
    } else {
      [assignment[keys[i]], assignment[keys[j]]] = [assignment[keys[j]], assignment[keys[i]]];
    }
  }
  return best;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function assignSeats(students, groups, sessions) {
  const usedPairs = buildUsedPairs(sessions);
  const allDeskIds = groups.flatMap(g => g.deskIds);
  const eligible = shuffle([...students]).slice(0, allDeskIds.length);

  // Try to find a perfect (zero-conflict) assignment first
  const exact = tryExact(
    eligible.map(s => s.id),
    groups,
    usedPairs,
    Date.now() + 250  // 250ms budget — fast enough for UI
  );
  if (exact) return exact;

  // No perfect solution exists: minimise conflicts instead
  return saAssign(eligible, groups, usedPairs);
}

export function getConflictCount(assignment, groups, sessions) {
  return scorePairs(groups, assignment, buildUsedPairs(sessions));
}
