// session.js

export function initSessionManager() {
  const modalOverlay = document.getElementById('session-modal-overlay');
  const modalTitle = document.getElementById('modal-target-title');
  const cancelBtn = document.getElementById('modal-opt-cancel');

  if (!modalOverlay) return;

  // 모달 닫기
  function closeModal() {
    modalOverlay.style.display = 'none';
  }

  // Active 세션 카드 클릭 시 모달 오픈
  document.querySelectorAll('#active-session-list .session-manage-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const sessionName = card.getAttribute('data-session-name') || 'Session';
      modalTitle.textContent = sessionName;
      modalOverlay.style.display = 'flex';
    });
  });

  // 취소 및 배경 클릭 시 닫기
  cancelBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // 모달 항목 이벤트 예시
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

// session.js 내부

export function updateEmptyState() {
  const activeList = document.getElementById('active-session-list');
  const emptyState = document.getElementById('active-empty-state');
  
  if (!activeList || !emptyState) return;

  // Active 카드 개수 확인
  const cardCount = activeList.querySelectorAll('.session-manage-card').length;

  if (cardCount === 0) {
    emptyState.style.setProperty('display', 'flex', 'important');
  } else {
    emptyState.style.setProperty('display', 'none', 'important');
  }
}

