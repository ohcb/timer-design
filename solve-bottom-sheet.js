// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  // 💡 전역 변수로 현재 선택된 카드 ID와 Undo 타이머를 관리합니다.
  let activeCardId = null; 
  let deleteTimeout = null;
  let pendingCardElement = null;

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    
    // 현재 클릭한 카드의 ID와 엘리먼트 기억
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
      
      // 🗑️ Delete 버튼을 눌렀을 때!
      if (event.target.id === 'menu-delete') {
        sheet.classList.remove('open'); // 일단 바텀시트 닫기
        
        if (pendingCardElement) {
          // 1. 장바구니에 담듯 화면에서 카드를 부드럽게 숨깁니다.
          pendingCardElement.classList.add('removing');
          
          // 2. 기존에 가동 중인 삭제 대기열이 있다면 청소
          if (deleteTimeout) clearTimeout(deleteTimeout);
          
          // 3. Undo 토스트 바를 화면에 띄웁니다.
          showUndoToast(() => {
            // [Undo 버튼 눌렀을 때 실행될 함수]
            pendingCardElement.classList.remove('removing'); // 카드 부활!
            console.log(`기록 ${activeCardId}번 복구됨`);
          }, () => {
            // [5초 동안 안 누르고 가만히 있어서 영구 삭제될 때 실행될 함수]
            pendingCardElement.remove(); // DOM에서 완전히 제거
            console.log(`기록 ${activeCardId}번 로컬스토리지/DB에서 영구 삭제됨`);
            // 나중에 여기에 실제 LocalStorage 삭제 코드 한 줄만 넣으면 끝납니다!
          });
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

  // 3. 바텀시트 아예 바깥을 누르면 미니 메뉴만 숨기기
  document.addEventListener('click', (event) => {
    const contextMenu = document.getElementById('sheet-context-menu');
    if (contextMenu && !event.target.closest('.more-menu-container')) {
      contextMenu.style.setProperty('display', 'none', 'important');
    }
  });

  // 💡 홍길동처럼 나타났다 사라질 Undo 토스트 생성 및 제어 함수
  function showUndoToast(onUndo, onPermanentDelete) {
    // 기존 토스트가 있다면 제거
    const oldToast = document.querySelector('.undo-toast');
    if (oldToast) oldToast.remove();

    // 새로운 토스트 바 HTML 동적 생성
    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    toast.innerHTML = `
      <span>기록이 삭제되었습니다.</span>
      <button class="undo-btn">Undo</button>
    `;
    document.body.appendChild(toast);

    // 0.1초 뒤 부드럽게 위로 올리기
    setTimeout(() => toast.classList.add('show'), 10);

    // 5초 카운트다운 시작 (가만히 두면 영구 삭제)
    deleteTimeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
      onPermanentDelete();
    }, 5000);

    // Undo 버튼 클릭 이벤트
    toast.querySelector('.undo-btn').addEventListener('click', () => {
      clearTimeout(deleteTimeout); // 영구 삭제 타이머 중단!
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
      onUndo(); // 복구 함수 실행
    });
  }
}
