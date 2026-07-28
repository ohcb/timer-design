// storage.js

// 💡 범용 저장/불러오기 헬퍼 함수 (session-manager.js 등에서 활용)
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Storage Save Error [${key}]:`, e);
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Storage Load Error [${key}]:`, e);
    return null;
  }
}

// ==========================================
// 💡 세션 내 개별 Solve(기록) 제어 헬퍼
// ==========================================

// 활성 세션 데이터 전체 불러오기/저장하기
function getSessionsData() {
  return loadFromStorage('cub3_sessions') || [];
}

function saveSessionsData(sessions) {
  saveToStorage('cub3_sessions', sessions);
}

// 특정 Solve 찾기 보조 함수
function findSolveInSessions(solveId) {
  const sessions = getSessionsData();
  for (const session of sessions) {
    const solve = session.solves.find(s => String(s.id) === String(solveId));
    if (solve) {
      return { sessions, session, solve };
    }
  }
  return { sessions, session: null, solve: null };
}

// 1. 특정 기록의 패널티 업데이트 ('NONE' | '+2' | 'DNF' 또는 숫자 패널티)
export function updateSolvePenalty(solveId, penalty) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.penalty = penalty;
    saveSessionsData(sessions);
  }
}

// 2. 특정 기록 삭제
export function deleteSolve(solveId) {
  const sessions = getSessionsData();
  for (const session of sessions) {
    const initialLen = session.solves.length;
    session.solves = session.solves.filter(s => String(s.id) !== String(solveId));
    if (session.solves.length !== initialLen) {
      saveSessionsData(sessions);
      break;
    }
  }
}

// 3. 메모(Note) 업데이트
export function updateSolveNote(solveId, note) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.note = note;
    saveSessionsData(sessions);
  }
}

// 4. 북마크(Bookmark) 토글
export function toggleSolveBookmark(solveId) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.isBookmarked = !solve.isBookmarked;
    saveSessionsData(sessions);
    return solve.isBookmarked;
  }
  return false;
}
