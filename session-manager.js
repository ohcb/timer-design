// session-manager.js
import { saveToStorage, loadFromStorage } from './storage.js';

// ==========================================
// 1. 데이터 State (내부 변수)
// ==========================================
let sessions = [];
let currentSessionId = null;

// ==========================================
// 2. 동기화 및 UI 헬퍼 함수
// ==========================================

// LocalStorage 동기화 (최상단 배치)
function persistState() {
  try {
    saveToStorage('cub3_sessions', sessions);
    saveToStorage('cub3_current_session_id', currentSessionId);
  } catch (e) {
    console.error('Session Persist Error:', e);
  }
}

// 💡 세션 개수에 따라 Empty State를 자동으로 숨기고 보여주는 함수
export function updateEmptyState() {
  const activeList = document.getElementById('active-session-list');
  const emptyState = document.getElementById('active-empty-state');

  if (!activeList || !emptyState) return;

  const activeCards = activeList.querySelectorAll('.session-manage-card');

  if (activeCards.length === 0) {
    emptyState.style.setProperty('display', 'flex', 'important');
  } else {
    emptyState.style.setProperty('display', 'none', 'important');
  }
}

// ==========================================
// 3. 데이터 제어 메서드 (CRUD)
// ==========================================

export function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || null;
}

// 🔑 [추가] 외부 모듈(timer.js 등)에서 변경된 현재 세션을 안전하게 저장하는 함수
export function saveCurrentSession(updatedSession) {
  if (!updatedSession) return;

  const index = sessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    sessions[index] = updatedSession;
  } else {
    sessions.push(updatedSession);
  }

  currentSessionId = updatedSession.id;
  updatedSession.updatedAt = Date.now();
  persistState();
}

export function getCurrentSessionId() {
  return currentSessionId;
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

export function createSession(name, event = '333') {
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
  currentSessionId = newSession.id;
  persistState();
  return newSession;
}

export function switchSession(targetSessionId) {
  const target = sessions.find(s => s.id === targetSessionId);
  if (!target || target.status === 'deleted') return false;

  currentSessionId = targetSessionId;
  persistState();
  return true;
}

export function addSolveToCurrentSession(time, penalty = 0, scramble = '') {
  const currentSession = getCurrentSession();
  if (!currentSession) return null;

  const now = Date.now();
  const newSolve = {
    id: `solve_${now}`,
    time: time,
    penalty: penalty,
    scramble: scramble,
    createdAt: now
  };

  currentSession.solves.push(newSolve);
  currentSession.updatedAt = now;
  persistState();
  return newSolve;
}

// ==========================================
// 4. 초기화 및 이벤트 리스너 바인딩
// ==========================================

export function initSessionManager() {
  // A. 데이터 초기화
  sessions = loadFromStorage('cub3_sessions') || [];
  currentSessionId = loadFromStorage('cub3_current_session_id') || null;

  if (sessions.length === 0) {
    const defaultSession = createSession('3x3 연습', '333');
    currentSessionId = defaultSession.id;
  } else if (!currentSessionId || !getCurrentSession()) {
    const activeSession = sessions.find(s => s.status === 'active') || sessions[0];
    currentSessionId = activeSession ? activeSession.id : null;
  }
  persistState();

  // B. UI 요소 가드 처리
  updateEmptyState();

  const modalOverlay = document.getElementById('session-modal-overlay');
  if (!modalOverlay) return; // 모달 요소가 없는 페이지에서는 이벤트 바인딩 건너뜀

  const modalTitle = document.getElementById('modal-target-title');
  const cancelBtn = document.getElementById('modal-opt-cancel');
  let activeTargetSessionId = null;

  function closeModal() {
    modalOverlay.style.display = 'none';
    activeTargetSessionId = null;
  }

  // Active 세션 카드 클릭 시 모달 오픈
  const activeList = document.getElementById('active-session-list');
  if (activeList) {
    activeList.addEventListener('click', (e) => {
      const card = e.target.closest('.session-manage-card');
      if (card) {
        activeTargetSessionId = card.getAttribute('data-session-id'); 
        const sessionName = card.getAttribute('data-session-name') || 'Session';
        
        if (modalTitle) modalTitle.textContent = sessionName;
        modalOverlay.style.display = 'flex';
      }
    });
  }

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.getElementById('modal-opt-rename')?.addEventListener('click', () => {
    if (!modalTitle) return;
    const currentName = modalTitle.textContent;
    const newName = prompt('Enter new session name:', currentName);
    
    if (newName && newName.trim() !== '') {
      const session = sessions.find(s => s.id === activeTargetSessionId);
      if (session) {
        session.name = newName.trim();
        session.updatedAt = Date.now();
        persistState();
      }
    }
    closeModal();
  });

  document.getElementById('modal-opt-archive')?.addEventListener('click', () => {
    const session = sessions.find(s => s.id === activeTargetSessionId);
    if (session) {
      session.status = 'completed';
      session.updatedAt = Date.now();
      persistState();
      updateEmptyState();
    }
    closeModal();
  });

  document.getElementById('modal-opt-delete')?.addEventListener('click', () => {
    const sessionName = modalTitle ? modalTitle.textContent : 'Session';
    if (confirm(`Delete "${sessionName}"? This cannot be undone.`)) {
      const session = sessions.find(s => s.id === activeTargetSessionId);
      if (session) {
        session.status = 'deleted';
        session.updatedAt = Date.now();
        persistState();
        updateEmptyState();
      }
    }
    closeModal();
  });
}
