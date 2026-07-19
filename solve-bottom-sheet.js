// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) {
    console.log("❌ 에러: 필수 컨테이너나 바텀시트를 찾을 수 없습니다.");
    return;
  }

  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');
  
  console.log("✅ 바텀시트 매니저 초기화 완료! 버튼 상태:", { moreBtn, contextMenu });

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    console.log("📇 기록 카드 클릭됨 -> 바텀시트 엶");
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트 처리
  sheet.addEventListener('click', (event) => {
    console.log("🎯 바텀시트 내부 클릭 감지됨:", event.target);
    
    // 💡 ⋮ 더보기 버튼 클릭 감지
    if (event.target.closest('#sheet-more-btn')) {
      event.stopPropagation();
      console.log("📱 더보기(⋮) 버튼 클릭됨!");
      console.log("현재 메뉴의 display 상태:", contextMenu.style.display);
      
      if (contextMenu.style.display === 'none' || contextMenu.style.display === '') {
        contextMenu.style.display = 'flex';
        console.log("-> 메뉴 엶 (display를 flex로 변경)");
      } else {
        contextMenu.style.display = 'none';
        console.log("-> 메뉴 닫음 (display를 none으로 변경)");
      }
      return;
    }

    // 메뉴 내부 아이템 클릭
    if (event.target.closest('.menu-item')) {
      contextMenu.style.display = 'none';
      return;
    }

    // 바깥 오버레이 클릭 시 닫기
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
      contextMenu.style.display = 'none';
    }
  });

  // 바텀시트 밖의 화면 클릭 시 메뉴 닫기
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.more-menu-container')) {
      if (contextMenu) contextMenu.style.display = 'none';
    }
  });
}
