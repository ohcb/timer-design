// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');

  // 1. 기록 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트 분기 처리
  sheet.addEventListener('click', (event) => {
    
    // 💡 ⋮ 더보기 버튼을 누르면 미니 메뉴 토글 (켜고 끄기)
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation(); // 오버레이 클릭 이벤트로 전파되는 것 방지
      contextMenu.classList.toggle('show');
      return;
    }

    // 💡 미니 메뉴 안의 아이템(Edit/Delete)을 누르면 일단 메뉴창 닫기
    if (event.target.closest('.menu-item')) {
      contextMenu.classList.remove('show');
      
      // [TODO] 다음 단계인 삭제 확인창 및 Undo(5초) 기능이 들어갈 자리입니다!
      if (event.target.id === 'menu-delete') {
        console.log('삭제 프로세스 작동 예정');
      }
      return;
    }

    // 💡 시트 본체(흰색 박스) 바깥의 어두운 오버레이 영역을 누르면 바텀시트 완전히 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.classList.remove('show'); // 메뉴 열려있었다면 같이 단속
    }
  });

  // 3. 바텀시트 밖의 엉뚱한 화면 전체를 누르더라도 미니 메뉴가 켜져 있다면 닫아주기
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.more-menu-container')) {
      contextMenu.classList.remove('show');
    }
  });
}
