// stats.js

export function initStats() {
  const eventBtn = document.getElementById('stats-event-btn');
  const eventMenu = document.getElementById('stats-event-menu');
  const viewOverview = document.getElementById('stats-view-overview');
  const viewEvent = document.getElementById('stats-view-event');
  const options = document.querySelectorAll('.stats-option');

  if (!eventBtn || !eventMenu) return;

  // 1. 종목 선택 드롭다운 토글
  eventBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = eventMenu.style.display === 'none' || eventMenu.style.display === '';
    eventMenu.style.display = isHidden ? 'flex' : 'none';
  });

  // 2. 외부 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!eventMenu.contains(e.target) && e.target !== eventBtn) {
      eventMenu.style.display = 'none';
    }
  });

  // 3. 종목 변경 이벤트 처리 (Overview <-> 종목별 화면 전환)
  options.forEach(option => {
    option.addEventListener('click', () => {
      const selectedEvent = option.getAttribute('data-event');

      // Active 클래스 갱신
      options.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      // 버튼 텍스트 변경 & 메뉴 닫기
      eventBtn.textContent = `${option.textContent} ▾`;
      eventMenu.style.display = 'none';

      // 화면 뷰 전환
      if (selectedEvent === 'overview') {
        if (viewOverview) viewOverview.style.display = 'flex';
        if (viewEvent) viewEvent.style.display = 'none';
      } else {
        if (viewOverview) viewOverview.style.display = 'none';
        if (viewEvent) viewEvent.style.display = 'flex';
        
        // TODO: selectedEvent (예: '3x3', '4x4')에 맞춰 기록 데이터 업데이트 로직 연결
        updateEventStats(selectedEvent);
      }
    });
  });
}

// 종목별 데이터 업데이트 함수 (나중에 localStorage나 DB 데이터 연결용)
function updateEventStats(eventName) {
  console.log(`Stats updated for event: ${eventName}`);
}
