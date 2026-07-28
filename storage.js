// storage.js

// 시크릿 모드용 임시 메모리 저장소
const memoryStorage = {};

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 💡 시크릿 모드로 인해 localStorage 저장이 막혀도 메모리에 임시 저장하여 앱이 터지지 않음
    memoryStorage[key] = JSON.stringify(value);
  }
}

export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : (memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null);
  } catch (e) {
    // 💡 시크릿 모드로 불러오기가 막혔을 때 메모리에서 가져옴
    return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null;
  }
}

// 특정 Solve 찾기 보조 함수
function findSolveInSessions(solveId) {
  const sessions = loadFromStorage('cub3_sessions') || [];
  for (const session of sessions) {
    const solve = session.solves.find(s => String(s.id) === String(solveId));
    if (solve) {
      return { sessions, session, solve };
    }
  }
  return { sessions: [], session: null, solve: null };
}

export function updateSolvePenalty(solveId, penalty) {
  const { sessions, solve } = findSolveInSessions(solveId);
  if (solve) {
    solve.penalty = penalty;
    saveToStorage('cub3_sessions', sessions);
  }
}

export function deleteSolve(solveId) {
  const sessions = loadFromStorage('cub3_sessions') || [];
  for (const session of sessions) {
    const initialLen = session.solves.length;
    session.solves = session.solves.filter(s => String(s.id) !== String(solveId));
    if (session.solves.length !== initialLen) {
      saveToStorage('cub3_sessions', sessions);
      break;
    }
  }
}
