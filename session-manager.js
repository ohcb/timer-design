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

// LocalStorage 동기화
function persistState() {
  try {
    saveToStorage('cub3_sessions', sessions);
    saveToStorage('cub3_current_session_id', currentSessionId);
  } catch (e) {
    console.error('Session Persist Error:', e);
  }
}

// 빈 상태 UI 전환
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

// 💡 세션 UI 렌더링 (드롭다운 & 관리 목록 동기화)
export function renderSessionUI() {
  // 1) 상단 세션 선택 드롭다운 갱신
  const sessionSelect = document.getElementById('session-select') || document.querySelector('.session-selector');
  const current = getCurrentSession();

  if (sessionSelect) {
    const activeSessions = getSessions({ status: 'active' });
    sessionSelect.innerHTML = activeSessions
      .map(s => `<option value="${s.id}" ${s.id === currentSessionId ? 'selected' : ''}>${s.name}</option>`)
      .join('');
  }

  // 2) 세션 관리 모달 활성 세션 리스트 갱신
  const activeList = document.getElementById('active-session-list');
  if (activeList) {
    const activeSessions = getSessions({ status: 'active' });
    activeList.innerHTML = activeSessions
      .map(s => `
        <div class="session-manage-card ${s.id === currentSessionId ? 'current' : ''}" data-session-id="${s.id}" data-session-name="${s.name}">
          <div class="session-info">
            <span class="session-name">${s.name} ${s.id === currentSessionId ? '⭐' : ''}</span>
            <span class="session-meta">${s.event.toUpperCase()} · ${s.solves ? s.solves.length : 0} solves</span>
          </div>
        </div>
      `)
      .join('');
  }

  // 3) 완료된 세션(Archive) 리스트 갱신
  const completedList = document.getElementById('completed-session-list');
  if (completedList) {
    const completedSessions = getSessions({ status: 'completed' });
    completedList.innerHTML = completedSessions
      .map(s => `
        <div class="session-manage-card completed" data-session-id="${s.id}" data-session-name="${s.name}">
          <div class="session-info">
            <span class="session-name">${s.name}</span>
            <span class="session-meta">${s.event.toUpperCase()} · ${s.solves ? s.solves.length : 0} solves</span>
          </div>
        </div>
      `)
      .join('');
  }

  updateEmptyState();
}

// ==========================================
// 3. 데이터 제어 메서드 (CRUD)
// ==========================================

export function getCurrentSession() {
  return sessions.find(s => s.id === currentSessionId) || null;
}

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
  renderSessionUI();
  return newSession;
}

export function switchSession(targetSessionId) {
  const target = sessions.find(s => s.id === targetSessionId);
  if (!target || target.status === 'deleted') return false;

  currentSessionId = targetSessionId;
  persistState();
  renderSessionUI();
  return true;
}

// 현재 세션이 완료/삭제되었을 때 안전하게 다른 active 세션으로 자동 전환
function ensureActiveCurrentSession() {
  const current = getCurrentSession();
  if (!current || current.status !== 'active') {
    const activeSessions = getSessions({ status: 'active' });
    if (activeSessions.length > 0) {
      currentSessionId = activeSessions[0].id;
    } else {
      // active 세션이 아예 없으면 기본 세션 자동 생성
      const newDefault = createSession('3x3 연습', '333');
      currentSessionId = newDefault.id;
    }
    persistState();
  }
}

export function addSolveToCurrentSession(time, penalty = 'NONE', scramble = '') {
  const currentSession = getCurrentSession();
  if (!currentSession) return null;

  const now = Date.now();
  const newSolve = {
    id: now,
    time: time,
    penalty: penalty,
    scramble: scramble,
    createdAt: now,
    note: '',
    isBookmarked: false
  };

  if (!currentSession.solves) currentSession.solves = [];
  currentSession.solves.unshift(newSolve);
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
  } else {
    ensureActiveCurrentSession();
  }
  persistState();

  // B. UI 동기화
  renderSessionUI();

  // C. 세션 선택 드롭다운 체인지 이벤트 바인딩
  const sessionSelect = document.getElementById('session-select') || document.querySelector('.session-selector');
  if (sessionSelect) {
    sessionSelect.addEventListener('change', (e) => {
      switchSession(e.target.value);
      // 외부 화면(타이머/기록 목록) 갱신
      if (window.renderRecentSolves) window.renderRecentSolves();
      if (window.renderStats) window.renderStats();
      if (window.renderSolvesList) window.renderSolvesList();
    });
  }

  // D. 모달 제어
  const modalOverlay = document.getElementById('session-modal-overlay');
  if (!modalOverlay) return;

  const modalTitle = document.getElementById('modal-target-title');
  const cancelBtn = document.getElementById('modal-opt-cancel');
  let activeTargetSessionId = null;

  function closeModal() {
    modalOverlay.style.display = 'none';
    activeTargetSessionId = null;
  }

  // Active 및 Completed 세션 카드 클릭 시 옵션 모달 오픈
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.session-manage-card');
    if (card) {
      activeTargetSessionId = card.getAttribute('data-session-id');
      const sessionName = card.getAttribute('data-session-name') || 'Session';

      if (modalTitle) modalTitle.textContent = sessionName;
      modalOverlay.style.display = 'flex';
    }
  });

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // 1) 이름 변경
  document.getElementById('modal-opt-rename')?.addEventListener('click', () => {
    if (!modalTitle || !activeTargetSessionId) return;
    const currentName = modalTitle.textContent;
    const newName = prompt('새 세션 이름을 입력하세요:', currentName);

    if (newName && newName.trim() !== '') {
      const session = sessions.find(s => s.id === activeTargetSessionId);
      if (session) {
        session.name = newName.trim();
        session.updatedAt = Date.now();
        persistState();
        renderSessionUI();
      }
    }
    closeModal();
  });

  // 2) 세션 완료 (아카이브 / 복원)
  document.getElementById('modal-opt-archive')?.addEventListener('click', () => {
    if (!activeTargetSessionId) return;
    const session = sessions.find(s => s.id === activeTargetSessionId);
    if (session) {
      // 이미 completed면 active로 복원, active면 completed 처리
      session.status = session.status === 'completed' ? 'active' : 'completed';
      session.updatedAt = Date.now();
      
      ensureActiveCurrentSession();
      persistState();
      renderSessionUI();

      if (window.renderRecentSolves) window.renderRecentSolves();
      if (window.renderStats) window.renderStats();
    }
    closeModal();
  });

  // 3) 세션 삭제
  document.getElementById('modal-opt-delete')?.addEventListener('click', () => {
    if (!activeTargetSessionId) return;
    const sessionName = modalTitle ? modalTitle.textContent : 'Session';
    
    if (confirm(`"${sessionName}" 세션을 삭제하시겠습니까?`)) {
      const session = sessions.find(s => s.id === activeTargetSessionId);
      if (session) {
        session.status = 'deleted';
        session.updatedAt = Date.now();

        ensureActiveCurrentSession();
        persistState();
        renderSessionUI();

        if (window.renderRecentSolves) window.renderRecentSolves();
        if (window.renderStats) window.renderStats();
      }
    }
    closeModal();
  });

  // 4) 새 세션 생성 버튼 연동
  const newSessionBtn = document.getElementById('btn-create-session') || document.querySelector('.create-session-btn');
  if (newSessionBtn) {
    newSessionBtn.addEventListener('click', () => {
      const name = prompt('새 세션 이름:', '3x3 연습');
      if (name) {
        createSession(name.trim(), '333');
        if (window.renderRecentSolves) window.renderRecentSolves();
        if (window.renderStats) window.renderStats();
      }
    });
  }
}
