// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  let deleteTimeout = null;
  let pendingCardElement = null;

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    
    pendingCardElement = card;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트 분기
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

    // Edit / Delete 메뉴 아이템 클릭
    if (event.target.closest('.menu-item')) {
      contextMenu.style.setProperty('display', 'none', 'important');
      
      // 🗑️ Delete 버튼 클릭 시
      if (event.target.id === 'menu-delete') {
        sheet.classList.remove('open'); // 바텀시트 닫기
        
        if (pendingCardElement) {
          // 1. 카드를 화면에서 스르륵 투명하게 숨기기
          pendingCardElement.classList.add('removing');
          
          // 2. 기존 타이머가 돌고 있다면 청소
          if (deleteTimeout) clearTimeout(deleteTimeout);
          
          // 3. 진짜 토스트 바 가동!
          triggerUndoToast();
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

  // 바탕 화면 클릭 시 미니 메뉴만 숨기기
  document.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (contextMenu && !event.target.closest('.more-menu-container')) {
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 💡 진짜로 토스트 바를 켜고 끄는 핵심 제어 함수
  function triggerUndoToast() {
    const toast = document.getElementById('global-undo-toast');
    const undoBtn = document.getElementById('global-undo-btn');
    if (!toast || !undoBtn) return;

    // [1] 토스트 바를 화면에 강제로 등장시킵니다.
    toast.style.setProperty('display', 'flex', 'important');
    
    // 브라우저가 정렬을 계산할 시간을 아주 잠깐(0.02초) 준 뒤 애니메이션 실행
    setTimeout(() => {
      toast.style.setProperty('opacity', '1', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 0)', 'important');
    }, 20);

    // [2] 5초 타이머 작동 (가만히 두면 영구 삭제)
    deleteTimeout = setTimeout(() => {
      // 토스트 바 아래로 숨기기
      toast.style.setProperty('opacity', '0', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 150px)', 'important');
      
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      // 5초 지났으니 진짜로 DOM(화면)에서 카드 없애버리기
      if (pendingCardElement) {
        pendingCardElement.remove();
        pendingCardElement = null;
      }
    }, 5000);

    // [3] Undo(실행 취소) 버튼을 눌렀을 때의 로직
    undoBtn.onclick = () => {
      clearTimeout(deleteTimeout); // 5초 카운트다운 폭파!
      
      // 토스트 바 숨기기
      toast.style.setProperty('opacity', '0', 'important');
      toast.style.setProperty('transform', 'translate(-50%, 150px)', 'important');
      
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      // 숨겨졌던 카드를 다시 선명하게 부활시키기!
      if (pendingCardElement) {
        pendingCardElement.classList.remove('removing');
        pendingCardElement = null;
      }
    };
  }
}
