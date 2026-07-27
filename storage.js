// storage.js

const STORAGE_KEY = 'cub3_state_v1';

export function getSolves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSolves(solves) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solves));
  } catch (e) {
    console.error('Storage Save Error:', e);
  }
}

export function addSolve(timeMs) {
  const solves = getSolves();
  const newSolve = {
    id: Date.now().toString(),
    time: timeMs,
    penalty: 'NONE', // 'NONE' | '+2' | 'DNF'
    createdAt: Date.now()
  };
  solves.unshift(newSolve);
  saveSolves(solves);
  return newSolve;
}

// 💡 특정 기록의 패널티 업데이트 (ID 타입 일치 보장)
export function updateSolvePenalty(id, penalty) {
  const solves = getSolves();
  const index = solves.findIndex(s => String(s.id) === String(id));
  if (index !== -1) {
    solves[index].penalty = penalty;
    saveSolves(solves);
  }
}

// 💡 특정 기록 삭제 (ID 타입 일치 보장)
export function deleteSolve(id) {
  const solves = getSolves();
  const filtered = solves.filter(s => String(s.id) !== String(id));
  saveSolves(filtered);
}

// 💡 메모(Note) 업데이트
export function updateSolveNote(id, note) {
  const solves = getSolves();
  const index = solves.findIndex(s => String(s.id) === String(id));
  if (index !== -1) {
    solves[index].note = note;
    saveSolves(solves);
  }
}

// 💡 북마크(Bookmark) 토글
export function toggleSolveBookmark(id) {
  const solves = getSolves();
  const index = solves.findIndex(s => String(s.id) === String(id));
  if (index !== -1) {
    solves[index].isBookmarked = !solves[index].isBookmarked;
    saveSolves(solves);
    return solves[index].isBookmarked;
  }
  return false;
}
