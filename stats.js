// stats.js

let distributionChart = null;
let selectedMobileEvent = null;

export function initStats() {
  const eventBtn = document.getElementById('stats-event-btn');
  const eventMenu = document.getElementById('stats-event-menu');
  const options = document.querySelectorAll('.stats-option');
  const scopeSelect = document.getElementById('stats-scope-select');

  if (!eventBtn || !eventMenu) return;

  // 1. Overview 드롭다운 토글
  eventBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = eventMenu.style.display === 'none' || eventMenu.style.display === '';
    eventMenu.style.display = isHidden ? 'flex' : 'none';
  });

  document.addEventListener('click', () => {
    eventMenu.style.display = 'none';
  });

  // 2. 종목 선택 및 화면 전환
  options.forEach(option => {
    option.addEventListener('click', () => {
      const selectedEvent = option.getAttribute('data-event');
      switchEventView(selectedEvent);
    });
  });

  // 3. 통계 범위 선택 드롭다운 이벤트 (Range Filter)
  if (scopeSelect) {
    scopeSelect.addEventListener('change', (e) => {
      const selectedScope = e.target.value;
      
      if (selectedScope === 'custom') {
        alert('사용자 지정 범위 모달 연결 예정');
        return;
      }

      // 선택된 범위에 따라 데이터 재계산 및 갱신
      updateEventStatsByScope(selectedScope);
    });
  }

  // 4. Event Distribution 원그래프 생성
  renderDistributionChart();
}

// 화면 전환 공통 함수 (세로 1열 고정 로직)
function switchEventView(eventName) {
  const eventBtn = document.getElementById('stats-event-btn');
  const viewOverview = document.getElementById('stats-view-overview');
  const viewEvent = document.getElementById('stats-view-event');
  const options = document.querySelectorAll('.stats-option');

  options.forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-event') === eventName);
  });

  const activeOption = Array.from(options).find(opt => opt.getAttribute('data-event') === eventName);
  eventBtn.textContent = activeOption ? activeOption.textContent : 'Overview';

  if (eventName === 'overview') {
    if (viewOverview) {
      viewOverview.style.setProperty('display', 'flex', 'important');
      viewOverview.style.setProperty('flex-direction', 'column', 'important');
      viewOverview.style.setProperty('width', '100%', 'important');
    }
    if (viewEvent) viewEvent.style.display = 'none';
  } else {
    if (viewOverview) viewOverview.style.display = 'none';
    if (viewEvent) {
      viewEvent.style.setProperty('display', 'flex', 'important');
      viewEvent.style.setProperty('flex-direction', 'column', 'important');
      viewEvent.style.setProperty('width', '100%', 'important');
    }
  }
}

// 5. Event Distribution 원그래프 (Chart.js)
function renderDistributionChart() {
  const ctx = document.getElementById('distribution-chart');
  if (!ctx) return;

  const isMobile = window.innerWidth <= 600;

  const chartData = {
    labels: ['3x3', '2x2', '4x4', 'OH', 'Others'],
    datasets: [{
      data: [10532, 2300, 1400, 850, 400],
      backgroundColor: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#6b7280'],
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  distributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#aeaeae', font: { size: 11 }, padding: 12 }
        },
        tooltip: {
          enabled: !isMobile
        }
      },
      onClick: (e, activeElements) => {
        if (!activeElements.length) return;

        const index = activeElements[0].index;
        const clickedEvent = chartData.labels[index];
        const solveCount = chartData.datasets[0].data[index];
        const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((solveCount / total) * 100);

        if (clickedEvent === 'Others') return;

        if (isMobile) {
          selectedMobileEvent = clickedEvent;
          const mobileCard = document.getElementById('mobile-event-card');
          const mobileName = document.getElementById('mobile-event-name');
          const mobileStats = document.getElementById('mobile-event-stats');
          const viewBtn = document.getElementById('mobile-view-stats-btn');

          if (mobileCard) {
            mobileName.textContent = clickedEvent;
            mobileStats.textContent = `${percentage}% · ${solveCount.toLocaleString()} solves`;
            mobileCard.style.display = 'flex';

            viewBtn.onclick = () => switchEventView(clickedEvent);
          }
        } else {
          switchEventView(clickedEvent);
        }
      }
    }
  });
}

// 6. 범위(Range) 변경 시 통계 데이터 갱신 함수
function updateEventStatsByScope(scope) {
  // TODO: 실제 솔브 데이터 연결 시 여기서 필터링 후 차트 및 지표 갱신
  console.log(`[Stats Scope Changed]: ${scope}`);
}
