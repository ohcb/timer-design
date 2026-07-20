// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  let activeCardId = null; 
  let deleteTimeout = null;
  let pendingCardElement = null;

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    
    activeCardId = card.getAttribute('data-id');
    pendingCardElement = card;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트
  sheet.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (!contextMenu) return;

    // 더보기(⋮) 버튼 클릭
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation();
      if (contextMenu.style.getPropertyValue('display') === 'flex') {
        contextMenu.style.setProperty('display', 'none', 'important');
      } else {
        contextMenu.style.setProperty('display', 'flex', 'important');
      }
      return;
    }

    // Edit / Delete 메뉴 클릭
    if (event.target.closest('.menu-item')) {
      contextMenu.style.setProperty('display', 'none', 'important');
      
      if (event.target.id === 'menu-delete') {
        sheet.classList.remove('open'); // 바텀시트 먼저 닫기
        
        if (pendingCardElement) {
          pendingCardElement.classList.add('removing'); // 카드 흐리게
          if (deleteTimeout) clearTimeout(deleteTimeout); // 타이머 리셋
          triggerUndoToast(); // 토스트 가동
        }
      }
      return;
    }

    // 바깥 오버레이 클릭 시 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 바탕화면 클릭 시 미니 메뉴 닫기
  document.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (contextMenu && !event.target.closest('.more-menu-container')) {
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 토스트 바 작동 제어 함수
  function triggerUndoToast() {
    const toast = document.getElementById('global-undo-toast');
    const undoBtn = document.getElementById('global-undo-btn');
    if (!toast || !undoBtn) return;

    // 1. 토스트 바 켜기 및 위로 올리기
    toast.style.setProperty('display', 'flex', 'important');
    setTimeout(() => {
      toast.style.setProperty('opacity', '1', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 0)', 'important');
    }, 50);

    // 2. 5초 뒤 자동 삭제 타이머
    deleteTimeout = setTimeout(() => {
      toast.style.setProperty('opacity', '0', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 150px)', 'important');
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      if (pendingCardElement) pendingCardElement.remove();
    }, 5000);

    // 3. Undo 버튼 클릭 시 되돌리기
    undoBtn.onclick = () => {
      clearTimeout(deleteTimeout);
      toast.style.setProperty('opacity', '0', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 150px)', 'important');
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      if (pendingCardElement) pendingCardElement.classList.remove('removing');
    };
  }
}
