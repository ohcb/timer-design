// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트 처리
  sheet.addEventListener('click', (event) => {
    
    // 💡 ⋮ 더보기 버튼을 누르면 인라인 스타일(display)을 직접 토글
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation(); // 오버레이 클릭 이벤트로 전파 방지
      
      if (contextMenu.style.display === 'none' || contextMenu.style.display === '') {
        contextMenu.style.display = 'flex'; // 숨겨져 있으면 켜기
      } else {
        contextMenu.style.display = 'none';  // 켜져 있으면 끄기
      }
      return;
    }

    // 💡 메뉴 내부 아이템(Edit/Delete)을 누르면 다시 숨기기
    if (event.target.closest('.menu-item')) {
      contextMenu.style.display = 'none';
      
      if (event.target.id === 'menu-delete') {
        console.log('삭제 프로세스 작동 예정');
      }
      return;
    }

    // 💡 시트 본체 바깥 영역(오버레이)을 누르면 바텀시트 완전히 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.style.display = 'none'; // 메뉴도 같이 단속
    }
  });

  // 3. 바텀시트 밖의 화면 전체를 누르더라도 미니 메뉴 닫아주기
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.more-menu-container')) {
      contextMenu.style.display = 'none';
    }
  });
}
