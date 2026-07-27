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

// 💡 [추가] 특정 기록의 패널티 업데이트
export function updateSolvePenalty(id, penalty) {
  const solves = getSolves();
  const index = solves.findIndex(s => s.id === id);
  if (index !== -1) {
    solves[index].penalty = penalty; // 'NONE', '+2', 'DNF'
    saveSolves(solves);
  }
}

// 💡 [추가] 특정 기록 삭제
export function deleteSolve(id) {
  const solves = getSolves();
  const filtered = solves.filter(s => s.id !== id);
  saveSolves(filtered);
}
