// storage.js

const STORAGE_KEY = 'cub3_state_v1';

// 기본 상태 구조 (초기 데이터)
const initialState = {
  activeSessionId: 'default',
  activeEventId: '333',
  sessions: {
    default: {
      id: 'default',
      name: 'Session 1',
      eventId: '333',
      solves: []
    }
  }
};

// 1. 상태 불러오기
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialState;
  } catch (e) {
    console.error('Failed to load state:', e);
    return initialState;
  }
}

// 2. 상태 저장하기
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// 현재 글로벌 상태 관리 객체
export const appState = loadState();

// 3. 현재 활성화된 세션 반환
export function getActiveSession() {
  return appState.sessions[appState.activeSessionId] || appState.sessions.default;
}

// 4. 새 기록 추가 및 저장
export function addSolve(timeMs, scramble = '') {
  const activeSession = getActiveSession();

  const newSolve = {
    id: Date.now().toString(),
    time: timeMs,
    penalty: null,
    scramble: scramble || document.querySelector('.scramble-text')?.textContent || '',
    eventId: appState.activeEventId,
    sessionId: appState.activeSessionId,
    createdAt: Date.now()
  };

  activeSession.solves.unshift(newSolve); // 최근 기록을 배열 맨 앞에 추가
  saveState(appState);

  console.log('💾 기록 저장 완료:', newSolve);
  return newSolve;
}
