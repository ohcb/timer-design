// session.js
// Session 탭 화면 렌더링 및 사용자 인터랙션 처리
// (데이터 로직은 session-manager.js, 여기선 DOM 렌더링/이벤트만 담당)

import {
  getSessions,
  getCurrentSessionId,
  createSession,
  switchSession,
  renameSession,
  archiveSession,
  deleteSession
} from './session-manager.js';

import { calculateAoN, getBestTime } from './stats-calculator.js';

let modalTargetId = null;

// ==========================================
// 1. 헬퍼 함수
// ==========================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatMs(ms) {
  return (ms / 1000).toFixed(2);
}

function buildStatsText(session) {
  const solves = session.solves || [];
  const count = solves.length;

  if (count === 0) return '0 solves';

  const ao5 = calculateAoN(solves, 5);
  const best = getBestTime(solves);

  const ao5Text = ao5 === null ? '-' : (ao5 === 'DNF' ? 'DNF' : formatMs(ao5));
  const bestText = best === null ? '-' : formatMs(best);

  return `${count} solves · Ao5 ${ao5Text} · Best ${bestText}`;
}

// ==========================================
// 2. 렌더링
// ==========================================

function sessionCardHTML(session, isCurrent) {
  return `
    <div class="session-manage-card ${isCurrent ? 'is-current' : ''}" data-session-id="${session.id}">
      <div class="card-left-info">
        <div class="session-title-row">
          ${isCurrent ? '<span class="current-dot">🟣</span>' : ''}
          <h4 class="session-name">${escapeHtml(session.name)}</h4>
        </div>
        <p class="session-stats">${buildStatsText(session)}</p>
      </div>
      <button class="card-more-btn" aria-label="Session Menu">⋮</button>
    </div>`;
}

function completedCardHTML(session) {
  return `
    <div class="session-manage-card completed-card" data-session-id="${session.id}">
      <div class="card-left-info">
        <h4 class="session-name">${escapeHtml(session.name)}</h4>
        <p class="session-stats">${buildStatsText(session)}</p>
      </div>
      <div class="card-action-btns">
        <button class="btn-text-purple restore-btn">Restore</button>
        <button class="btn-text-red delete-btn">Delete</button>
      </div>
    </div>`;
}

export function renderSessionList() {
  const activeList = document.getElementById('active-session-list');
  const completedList = document.getElementById('completed-session-list');
  const emptyState = document.getElementById('active-empty-state');
  if (!activeList || !completedList) return;

  const currentId = getCurrentSessionId();
  const activeSessions = getSessions({ status: 'active' });
  const completedSessions = getSessions({ status: 'completed' });

  if (activeSessions.length === 0) {
    activeList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
  } else {
    if (emptyState) emptyState.style.display = 'none';
    activeList.innerHTML = activeSessions
      .map(s => sessionCardHTML(s, s.id === currentId))
      .join('');
  }

  completedList.innerHTML = completedSessions.map(s => completedCardHTML(s)).join('');
}

// 상단 탑바의 Session 드롭다운을 실제 세션 목록/현재 세션과 동기화
export function renderHeaderSessionSelect() {
  const select = document.getElementById('header-session-select');
  if (!select) return;

  const currentId = getCurrentSessionId();
  const activeSessions = getSessions({ status: 'active' });

  select.innerHTML = activeSessions
    .map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
    .join('');

  select.value = currentId;
}

function refreshSessionUI() {
  renderSessionList();
  renderHeaderSessionSelect();
}

// ==========================================
// 3. 모달 (Rename / Archive / Delete 메뉴)
// ==========================================

function openSessionModal(name) {
  const overlay = document.getElementById('session-modal-overlay');
  const title = document.getElementById('modal-target-title');
  if (title) title.textContent = name;
  if (overlay) overlay.style.setProperty('display', 'flex', 'important');
}

function closeSessionModal() {
  const overlay = document.getElementById('session-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  modalTargetId = null;
}

// ==========================================
// 4. 초기화 & 이벤트 바인딩
// ==========================================

export function initSessionUI() {
  refreshSessionUI();

  // 헤더 Session 드롭다운에서 직접 세션을 바꾸는 경우
  document.addEventListener('change', (e) => {
    if (e.target.matches('#header-session-select')) {
      switchSession(e.target.value);
      refreshSessionUI();
    }
  });

  // 다른 경로(예: 세션 자동 전환 등)로 currentSession이 바뀌어도 헤더/목록 동기화
  document.addEventListener('cub3:session-changed', () => {
    refreshSessionUI();
  });

  document.addEventListener('click', (e) => {
    // 새 세션 생성
    if (e.target.closest('#create-session-btn, #empty-create-btn')) {
      const defaultName = `Session ${getSessions({ status: 'active' }).length + 1}`;
      const name = prompt('세션 이름을 입력하세요', defaultName);
      if (name && name.trim()) {
        createSession(name.trim(), '333');
        refreshSessionUI();
      }
      return;
    }

    // 세션 카드의 ⋮ 메뉴 버튼
    const moreBtn = e.target.closest('.card-more-btn');
    if (moreBtn) {
      const card = moreBtn.closest('.session-manage-card');
      if (card) {
        modalTargetId = card.getAttribute('data-session-id');
        openSessionModal(card.querySelector('.session-name')?.textContent || '');
      }
      return;
    }

    // 완료된 세션 복원
    const restoreBtn = e.target.closest('.restore-btn');
    if (restoreBtn) {
      const card = restoreBtn.closest('.session-manage-card');
      if (card) {
        archiveSession(card.getAttribute('data-session-id'));
        refreshSessionUI();
      }
      return;
    }

    // 완료된 세션 완전 삭제
    const deleteBtnCompleted = e.target.closest('.card-action-btns .delete-btn');
    if (deleteBtnCompleted) {
      const card = deleteBtnCompleted.closest('.session-manage-card');
      if (card && confirm('이 세션을 완전히 삭제하시겠습니까? 복구할 수 없습니다.')) {
        deleteSession(card.getAttribute('data-session-id'));
        refreshSessionUI();
      }
      return;
    }

    // 활성 세션 카드 클릭 → 해당 세션으로 전환
    const activeCard = e.target.closest('#active-session-list .session-manage-card');
    if (activeCard) {
      switchSession(activeCard.getAttribute('data-session-id'));
      refreshSessionUI();
      return;
    }

    // 모달: Rename
    if (e.target.closest('#modal-opt-rename')) {
      if (modalTargetId) {
        const target = getSessions({}).find(s => s.id === modalTargetId);
        const newName = prompt('새 세션 이름', target ? target.name : '');
        if (newName && newName.trim()) {
          renameSession(modalTargetId, newName.trim());
          refreshSessionUI();
        }
      }
      closeSessionModal();
      return;
    }

    // 모달: Archive
    if (e.target.closest('#modal-opt-archive')) {
      if (modalTargetId) {
        archiveSession(modalTargetId);
        refreshSessionUI();
      }
      closeSessionModal();
      return;
    }

    // 모달: Delete
    if (e.target.closest('#modal-opt-delete')) {
      if (modalTargetId && confirm('이 세션을 완전히 삭제하시겠습니까? 복구할 수 없습니다.')) {
        deleteSession(modalTargetId);
        refreshSessionUI();
      }
      closeSessionModal();
      return;
    }

    // 모달: Cancel / 바깥 영역 클릭 시 닫기
    if (e.target.closest('#modal-opt-cancel')) {
      closeSessionModal();
      return;
    }

    const overlay = document.getElementById('session-modal-overlay');
    if (overlay && e.target === overlay) {
      closeSessionModal();
    }
  });
}
