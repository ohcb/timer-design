// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트 분기
  sheet.addEventListener('click', (event) => {
    // 💡 HTML 안에서 최신 상태의 메뉴 엘리먼트를 매번 확실하게 새로 찾음
    const contextMenu = document.getElementById('sheet-context-menu');
    if (!contextMenu) return;

    // 💡 [Case 1] 더보기(⋮) 버튼을 눌렀을 때
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation(); // 오버레이 클릭 방지
      
      // 현재 스타일 상태를 체크해서 직통으로 토글
      if (contextMenu.style.getPropertyValue('display') === 'flex') {
        contextMenu.style.setProperty('display', 'none', 'important');
      } else {
        contextMenu.style.setProperty('display', 'flex', 'important');
      }
      return;
    }

    // 💡 [Case 2] Edit 이나 Delete 메뉴 아이템을 눌렀을 때
    if (event.target.closest('.menu-item')) {
      contextMenu.style.setProperty('display', 'none', 'important');
      
      if (event.target.id === 'menu-delete') {
        alert("🗑️ 삭제 기능이 곧 구현될 예정입니다!"); // 콘솔 대신 눈에 보이는 알림창으로 변경
      }
      return;
    }

    // 💡 [Case 3] 흰색 박스 바깥(어두운 배경)을 눌렀을 때 바텀시트 완전히 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 3. 바텀시트 아예 바깥(화면 전체)을 누르면 미니 메뉴만 숨기기
  document.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (contextMenu && !event.target.closest('.more-menu-container')) {
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });
}
