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

  // 2. 바텀 시트 내부 클릭 이벤트 분기
  sheet.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (!contextMenu) return;

    // [Case 1] 더보기(⋮) 버튼 클릭
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation();
      if (contextMenu.style.getPropertyValue('display') === 'flex') {
        contextMenu.style.setProperty('display', 'none', 'important');
      } else {
        contextMenu.style.setProperty('display', 'flex', 'important');
      }
      return;
    }

    // [Case 2] Edit / Delete 메뉴 아이템 클릭
    if (event.target.closest('.menu-item')) {
      contextMenu.style.setProperty('display', 'none', 'important');
      
      // 🗑️ Delete 버튼 클릭 시
      if (event.target.id === 'menu-delete') {
        sheet.classList.remove('open'); // 바텀시트 닫기
        
        if (pendingCardElement) {
          // 카드를 화면에서 흐리게 숨김
          pendingCardElement.classList.add('removing');
          
          // 기존 타이머 리셋
          if (deleteTimeout) clearTimeout(deleteTimeout);
          
          // 미리 만들어둔 토스트 바 작동시키기
          triggerUndoToast();
        }
      }
      return;
    }

    // [Case 3] 바깥 오버레이 클릭 시 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 바텀시트 아예 바깥을 누르면 미니 메뉴만 숨기기
  document.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (contextMenu && !event.target.closest('.more-menu-container')) {
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 💡 HTML에 박혀있는 토스트 바를 직접 제어하는 함수
  function triggerUndoToast() {
    const toast = document.getElementById('global-undo-toast');
    const undoBtn = document.getElementById('global-undo-btn');
    if (!toast || !undoBtn) return;

    // 1. 토스트 바 강제 노출
    toast.style.setProperty('display', 'flex', 'important');
    setTimeout(() => toast.classList.add('show'), 10);

    // 2. 5초 뒤 자동 영구 삭제 타이머
    deleteTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      if (pendingCardElement) {
        pendingCardElement.remove(); // DOM에서 카드 영구 제거
        console.log("영구 삭제 완료");
      }
    }, 5000);

    // 3. Undo 버튼 클릭 이벤트 바인딩 (이전 이벤트 중복 방지를 위해 새로 세팅)
    undoBtn.onclick = () => {
      clearTimeout(deleteTimeout); // 타이머 중단
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.setProperty('display', 'none', 'important');
      }, 300);
      
      if (pendingCardElement) {
        pendingCardElement.classList.remove('removing'); // 카드 다시 살리기
        console.log("복구 완료");
      }
    };
  }
}
