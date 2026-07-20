// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

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
          // 💡 우선 카드를 화면에서 흐리게 처리 (애니메이션 확인용)
          pendingCardElement.classList.add('removing');
          
          // 에러를 유발하던 임시 토스트 호출을 지우고, 브라우저 기본 알림창으로 대체
          setTimeout(() => {
            alert("삭제 기능 로직이 정상 작동 중입니다! (나중에 토스트 연동 예정)");
          }, 100);
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
}
