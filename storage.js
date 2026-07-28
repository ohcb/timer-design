// storage.js

// 💡 시크릿 모드 및 localStorage 차단 환경용 메모리 저장소
const memoryStorage = {};

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    memoryStorage[key] = JSON.stringify(value);
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : (memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null);
  } catch (e) {
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

// 🔑 [핵심 추가] 타 모듈에서 호환성을 위해 찾는 getSolves 함수
export function getSolves() {
  const sessions = getSessionsData();
  const currentSessionId = loadFromStorage('cub3_current_session_id');
  
  // 현재 활성화된 세션 찾기 (없으면 첫 번째 세션 사용)
  const activeSession = sessions.find(s => String(s.id) === String(currentSessionId)) || sessions[0];
  
  return activeSession ? (activeSession.solves || []) : [];
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
