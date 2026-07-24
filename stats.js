document.addEventListener('DOMContentLoaded', () => {
  const eventBtn = document.getElementById('stats-event-btn');
  const eventMenu = document.getElementById('stats-event-menu');
  const viewOverview = document.getElementById('stats-view-overview');
  const viewEvent = document.getElementById('stats-view-event');
  const options = document.querySelectorAll('.stats-option');

  if (!eventBtn || !eventMenu) return;

  // 드롭다운 토글
  eventBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = eventMenu.style.display === 'none';
    eventMenu.style.display = isHidden ? 'flex' : 'none';
  });

  // 메뉴 바깥 클릭 시 닫기
  document.addEventListener('click', () => {
    eventMenu.style.display = 'none';
  });

  // 종목 선택 시 화면 전환
  options.forEach(option => {
    option.addEventListener('click', () => {
      const selectedEvent = option.getAttribute('data-event');

      options.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');

      eventBtn.textContent = `${option.textContent} ▾`;
      eventMenu.style.display = 'none';

      if (selectedEvent === 'overview') {
        viewOverview.style.display = 'flex';
        viewEvent.style.display = 'none';
      } else {
        viewOverview.style.display = 'none';
        viewEvent.style.display = 'flex';
      }
    });
  });
});
