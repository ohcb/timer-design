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

  // 2. 바텀 시트 배경 또는 내부 로직 처리
  sheet.addEventListener('click', (event) => {
    // 💡 ⋮ 더보기 버튼을 누르면 메뉴 켜고 끄기
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation(); // 이벤트 전파 방지
      contextMenu.classList.toggle('show');
      return;
    }

    // 💡 메뉴 내부 아이템(Edit/Delete)을 누르면 일단 메뉴는 닫기
    if (event.target.closest('.menu-item')) {
      contextMenu.classList.remove('show');
      
      // 여기에 추후 삭제(Undo 포함) 로직 연동 예정!
      if (event.target.id === 'menu-delete') {
        console.log('삭제 프로세스 작동 예정');
      }
      return;
    }

    // 💡 시트 본체 바깥 영역(오버레이)을 클릭하면 바텀시트 완전히 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.classList.remove('show'); // 메뉴도 같이 단속
    }
  });

  // 3. 바텀시트 영역 밖의 화면을 누르면 콘텍스트 메뉴만 닫아주는 글로벌 이벤트
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.more-menu-container')) {
      contextMenu.classList.remove('show');
    }
  });
}
