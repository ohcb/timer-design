// storage.js
const STORAGE_KEY = 'cub3_state_v1';

const initialState = {
  solves: []
};

export function getSolves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addSolve(timeMs) {
  const solves = getSolves();
  const newSolve = {
    id: Date.now().toString(),
    time: timeMs,
    createdAt: Date.now()
  };
  solves.unshift(newSolve); // 최근 기록을 배열 맨 앞에 추가
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solves));
  } catch (e) {
    console.error('Storage Save Error:', e);
  }
  return newSolve;
}
