// session.js

// 💡 세션 개수에 따라 Empty State를 자동으로 숨기고 보여주는 함수
export function updateEmptyState() {
  const activeList = document.getElementById('active-session-list');
  const emptyState = document.getElementById('active-empty-state');

  if (!activeList || !emptyState) return;

  // active-session-list 안에 있는 세션 카드 개수 세기
  const activeCards = activeList.querySelectorAll('.session-manage-card');

  if (activeCards.length === 0) {
    // 세션이 0개면 빈 상태 카드 보여주기
    emptyState.style.setProperty('display', 'flex', 'important');
  } else {
    // 세션이 1개 이상이면 빈 상태 카드 완전히 숨기기
    emptyState.style.setProperty('display', 'none', 'important');
  }
}

export function initSessionManager() {
  const modalOverlay = document.getElementById('session-modal-overlay');
  const modalTitle = document.getElementById('modal-target-title');
  const cancelBtn = document.getElementById('modal-opt-cancel');

  // 1. 페이지 로드 즉시 세션 개수 체크해서 Empty State 정리
  updateEmptyState();

  if (!modalOverlay) return;

  // 모달 닫기
  function closeModal() {
    modalOverlay.style.display = 'none';
  }

  // Active 세션 카드 클릭 시 모달 오픈 (이벤트 위임 방식으로 등록하여 동적 변경에도 대응)
  const activeList = document.getElementById('active-session-list');
  if (activeList) {
    activeList.addEventListener('click', (e) => {
      const card = e.target.closest('.session-manage-card');
      if (card) {
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

  // 모달 내 옵션 버튼들
  document.getElementById('modal-opt-rename')?.addEventListener('click', () => {
    const currentName = modalTitle.textContent;
    const newName = prompt('Enter new session name:', currentName);
    if (newName && newName.trim() !== '') {
      alert(`Renamed to "${newName.trim()}"`);
    }
    closeModal();
  });

  document.getElementById('modal-opt-archive')?.addEventListener('click', () => {
    alert(`Archived "${modalTitle.textContent}"`);
    closeModal();
  });

  document.getElementById('modal-opt-delete')?.addEventListener('click', () => {
    if (confirm(`Delete "${modalTitle.textContent}"? This cannot be undone.`)) {
      alert('Deleted.');
    }
    closeModal();
  });
}
