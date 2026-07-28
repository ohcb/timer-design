// session-manager.js
import { saveToStorage, loadFromStorage } from './storage.js';

// ==========================================
// 1. 데이터 State (내부 변수)
// ==========================================
let sessions = [];
let currentSessionId = null;

// ==========================================
// 2. UI 제어 함수 (기존 구현 유지)
// ==========================================

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

// LocalStorage 동기화
function persistState() {
  saveToStorage('cub3_sessions', sessions);
  saveToStorage('cub3_current_session_id', currentSessionId);
}

// ==========================================
// 3. 데이터 제어 메서드 (CRUD)
// ==========================================

export function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || null;
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
    currentSessionId = activeSession.id;
  }
  persistState();

  // B. UI 요소 가져오기
  const modalOverlay = document.getElementById('session-modal-overlay');
  const modalTitle = document.getElementById('modal-target-title');
  const cancelBtn = document.getElementById('modal-opt-cancel');

  let activeTargetSessionId = null; // 모달이 켜졌을 때 선택된 세션 ID 저장용

  // 1. 페이지 로드 즉시 세션 개수 체크해서 Empty State 정리
  updateEmptyState();

  if (!modalOverlay) return;

  function closeModal() {
    modalOverlay.style.display = 'none';
    activeTargetSessionId = null;
  }

  // Active 세션 카드 클릭 시 모달 오픈 (이벤트 위임)
  const activeList = document.getElementById('active-session-list');
  if (activeList) {
    activeList.addEventListener('click', (e) => {
      const card = e.target.closest('.session-manage-card');
      if (card) {
        // HTML 요소에 data-session-id 속성도 부여해 두면 연동하기 아주 쉽습니다.
        activeTargetSessionId = card.getAttribute('data-session-id'); 
        const sessionName = card.getAttribute('data-session-name') || 'Session';
        
        if (modalTitle) modalTitle.textContent = sessionName;
        modalOverlay.style.display = 'flex';
      }
    });
  }

  // 취소 버튼 및 배경 클릭 시 모달 닫기
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // 모달 옵션 1: 이름 변경 (Rename)
  document.getElementById('modal-opt-rename')?.addEventListener('click', () => {
    const currentName = modalTitle.textContent;
    const newName = prompt('Enter new session name:', currentName);
    
    if (newName && newName.trim() !== '') {
      const session = sessions.find(s => s.id === activeTargetSessionId);
      if (session) {
        session.name = newName.trim();
        session.updatedAt = Date.now();
        persistState();
        // UI 갱신 로직 (필요시 renderSessionList() 호출)
      }
    }
    closeModal();
  });

  // 모달 옵션 2: 완료/보관 (Archive / Complete)
  document.getElementById('modal-opt-archive')?.addEventListener('click', () => {
    const session = sessions.find(s => s.id === activeTargetSessionId);
    if (session) {
      session.status = 'completed';
      session.updatedAt = Date.now();
      persistState();
      // UI 갱신 & Empty State 체크
      updateEmptyState();
    }
    closeModal();
  });

  // 모달 옵션 3: 삭제 (Delete)
  document.getElementById('modal-opt-delete')?.addEventListener('click', () => {
    if (confirm(`Delete "${modalTitle.textContent}"? This cannot be undone.`)) {
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
