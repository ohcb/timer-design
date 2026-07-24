// stats.js

let distributionChart = null;
let selectedMobileEvent = null;

export function initStats() {
  const eventBtn = document.getElementById('stats-event-btn');
  const eventMenu = document.getElementById('stats-event-menu');
  const viewOverview = document.getElementById('stats-view-overview');
  const viewEvent = document.getElementById('stats-view-event');
  const options = document.querySelectorAll('.stats-option');

  if (!eventBtn || !eventMenu) return;

  // 1. Overview 버튼 클릭 토글 (▼ 제거된 디자인)
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

  // 3. Event Distribution 원그래프 생성
  renderDistributionChart();
}

// 화면 전환 공통 함수
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
    if (viewOverview) viewOverview.style.display = 'flex';
    if (viewEvent) viewEvent.style.display = 'none';
  } else {
    if (viewOverview) viewOverview.style.display = 'none';
    if (viewEvent) viewEvent.style.display = 'flex';
  }
}

// 4. Event Distribution 원그래프 (Chart.js)
function renderDistributionChart() {
  const ctx = document.getElementById('distribution-chart');
  if (!ctx) return;

  const isMobile = window.innerWidth <= 600;

  // 샘플 데이터 (상위 종목 + Others)
  const chartData = {
    labels: ['3x3', '2x2', '4x4', 'OH', 'Others'],
    datasets: [{
      data: [10532, 2300, 1400, 850, 400], // Solves 횟수
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
          enabled: !isMobile // 모바일에선 기본 툴팁 끄고 전용 카드 활성화
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
          // 모바일: 터치 시 하단에 'View Stats' 카드 표시
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
          // PC: 클릭 시 해당 종목 Stats 화면으로 바로 이동
          switchEventView(clickedEvent);
        }
      }
    }
  });
}
