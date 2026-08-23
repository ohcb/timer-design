// session-manager.js
import { saveToStorage, loadFromStorage } from './storage.js';

// ==========================================
// 1. Internal State
// ==========================================
let sessions = [];
let currentSessionId = null;

const STORAGE_KEYS = {
  SESSIONS: 'cub3_sessions',
  CURRENT_ID: 'cub3_current_session_id'
};

// ==========================================
// 2. Storage & Helpers
// ==========================================

function persist() {
  try {
    saveToStorage(STORAGE_KEYS.SESSIONS, sessions);
    saveToStorage(STORAGE_KEYS.CURRENT_ID, currentSessionId);
  } catch (e) {
    console.error('Session Persist Error:', e);
  }
}

// currentSessionId가 실제로 바뀔 때만 전역 이벤트 발행
// (Timer/Solves 등 다른 탭이 이걸 구독해서 즉시 갱신함)
function setCurrentSessionId(id) {
  if (id === currentSessionId) return;
  currentSessionId = id;
  document.dispatchEvent(new CustomEvent('cub3:session-changed', {
    detail: { sessionId: currentSessionId }
  }));
}

// 현재 활성화된 세션이 유효한지 확인하고, 없으면 안전한 세션으로 자동 전환
function ensureActiveSession() {
  const current = getCurrentSession();
  
  // 현재 세션이 없거나 active 상태가 아니면
  if (!current || current.status !== 'active') {
    const activeSessions = getSessions({ status: 'active' });
    if (activeSessions.length > 0) {
      setCurrentSessionId(activeSessions[0].id);
    } else {
      // active 세션이 아예 없으면 기본 세션 1개 생성
      const defaultSession = createSessionRaw('3x3 연습', '333');
      setCurrentSessionId(defaultSession.id);
    }
    persist();
  }
}

function createSessionRaw(name, event = '333') {
  const now = Date.now();
  const newSession = {
    id: `session_${now}_${Math.random().toString(36).substr(2, 4)}`,
    name: name || `${new Date().toISOString().slice(0, 10)} ${event.toUpperCase()}`,
    event: event,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    solves: []
  };

  sessions.push(newSession);
  return newSession;
}

// ==========================================
// 3. Public Data Methods (CRUD)
// ==========================================

export function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || null;
}

export function getCurrentSessionId() {
  return currentSessionId;
}

export function saveCurrentSession(updatedSession) {
  if (!updatedSession) return;
  const index = sessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    sessions[index] = updatedSession;
  } else {
    sessions.push(updatedSession);
  }
  updatedSession.updatedAt = Date.now();
  setCurrentSessionId(updatedSession.id);
  persist();
}

export function getSessions(filter = {}) {
  return sessions
    .filter(s => {
      if (filter.event && s.event !== filter.event) return false;
      if (filter.status && s.status !== filter.status) return false;
      if (!filter.includeDeleted && s.status === 'deleted') return false;
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

// [생성]
export function createSession(name, event = '333') {
  const newSession = createSessionRaw(name, event);
  setCurrentSessionId(newSession.id);
  persist();
  return newSession;
}

// [스위칭]
export function switchSession(targetSessionId) {
  const target = sessions.find(s => s.id === targetSessionId);
  if (!target || target.status !== 'active') return false;

  setCurrentSessionId(targetSessionId);
  persist();
  return true;
}

// [이름 변경]
export function renameSession(sessionId, newName) {
  const target = sessions.find(s => s.id === sessionId);
  if (!target || !newName.trim()) return false;

  target.name = newName.trim();
  target.updatedAt = Date.now();
  persist();
  return true;
}

// [완료/복원 (Archive Toggle)]
export function archiveSession(sessionId) {
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return false;

  target.status = target.status === 'completed' ? 'active' : 'completed';
  target.updatedAt = Date.now();
  
  ensureActiveSession();
  persist();
  return true;
}

// [삭제]
export function deleteSession(sessionId) {
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return false;

  target.status = 'deleted';
  target.updatedAt = Date.now();

  ensureActiveSession();
  persist();
  return true;
}

// ==========================================
// 4. Initialization
// ==========================================

export function initSessionManager() {
  sessions = loadFromStorage(STORAGE_KEYS.SESSIONS) || [];
  currentSessionId = loadFromStorage(STORAGE_KEYS.CURRENT_ID) || null;

  if (sessions.length === 0) {
    createSession('3x3 연습', '333');
  } else {
    ensureActiveSession();
  }

  persist();
}
