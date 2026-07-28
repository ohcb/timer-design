// storage.js

// 💡 시크릿 모드 및 localStorage 차단 환경용 메모리 저장소
const memoryStorage = {};

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 시크릿 모드로 인해 localStorage가 막히면 메모리에 임시 저장
    memoryStorage[key] = JSON.stringify(value);
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : (memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null);
  } catch (e) {
    // 시크릿 모드일 경우 메모리에서 불러옴
    return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null;
  }
}

// ==========================================
// 💡 세션 내 개별 Solve(기록) 제어 헬퍼
// ==========================================

function getSessionsData() {
  return loadFromStorage('cub3_sessions') || [];
}

function saveSessionsData(sessions) {
  saveToStorage('cub3_sessions', sessions);
}

function findSolveInSessions(solveId) {
  const sessions = getSessionsData();
  for (const session of sessions) {
    const solve = session.solves?.find(s => String(s.id) === String(solveId));
    if (solve) {
      return { sessions, session, solve };
    }
  }
  return { sessions, session: null, solve: null };
}

export function updateSolvePenalty(solveId, penalty) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.penalty = penalty;
    saveSessionsData(sessions);
  }
}

export function deleteSolve(solveId) {
  const sessions = getSessionsData();
  for (const session of sessions) {
    if (!session.solves) continue;
    const initialLen = session.solves.length;
    session.solves = session.solves.filter(s => String(s.id) !== String(solveId));
    if (session.solves.length !== initialLen) {
      saveSessionsData(sessions);
      break;
    }
  }
}

export function updateSolveNote(solveId, note) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.note = note;
    saveSessionsData(sessions);
  }
}

export function toggleSolveBookmark(solveId) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.isBookmarked = !solve.isBookmarked;
    saveSessionsData(sessions);
    return solve.isBookmarked;
  }
  return false;
}
