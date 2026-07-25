// stats.js

let distributionChart = null;
let timeProgressChart = null;
let recordDistChart = null;
let selectedMobileEvent = null;
let currentChartType = 'single'; // Time Progress 차트 선택용 (single, mo3, ao5, ao12, ao100)

export function initStats() {
  const eventBtn = document.getElementById('stats-event-btn');
  const eventMenu = document.getElementById('stats-event-menu');
  const options = document.querySelectorAll('.stats-option');
  const scopeSelect = document.getElementById('stats-scope-select');
  const sessionSelect = document.getElementById('stats-session-select');
  const chipBtns = document.querySelectorAll('.chip-btn');

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

  // 3. 세션 & 범위 선택 이벤트
  if (scopeSelect) {
    scopeSelect.addEventListener('change', (e) => {
      const selectedScope = e.target.value;
      if (selectedScope === 'custom') {
        alert('사용자 지정 범위 모달 연결 예정');
        return;
      }
      updateEventStatsData();
    });
  }

  if (sessionSelect) {
    sessionSelect.addEventListener('change', () => {
      updateEventStatsData();
    });
  }

  // 4. Time Progress 칩 버튼 이벤트 (Single/Mo3/Ao5 등)
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chipBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.getAttribute('data-type');
      renderTimeProgressChart(); // 차트 데이터 업데이트
    });
  });

  // 5. 초기 차트 및 화면 렌더링
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
    // Event View 진입 시 데이터 갱신 및 차트 그리기
    updateEventStatsData();
  }
}

// ==========================================
// 📊 차트 렌더링 함수들
// ==========================================

// 1. Overview - Event Distribution 원그래프
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

  if (distributionChart) distributionChart.destroy();

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
        tooltip: { enabled: !isMobile }
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

// 2. Event Specific - Time Progress (꺾은선 그래프 + Rolling Average)
function renderTimeProgressChart(solves = []) {
  const ctx = document.getElementById('time-progress-chart');
  if (!ctx) return;

  // 샘플/더미 데이터 (실제 데이터 연동 전 시각화용)
  const dummyLabels = Array.from({ length: 20 }, (_, i) => `#${i + 1}`);
  const dummyData = [12.5, 11.8, 13.1, 10.9, 11.2, 12.0, 9.8, 11.5, 10.4, 12.1, 11.0, 10.8, 12.8, 11.4, 9.5, 10.2, 11.9, 12.3, 10.6, 11.1];

  if (timeProgressChart) timeProgressChart.destroy();

  timeProgressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dummyLabels,
      datasets: [{
        label: `${currentChartType.toUpperCase()} Progress`,
        data: dummyData,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: '#a855f7',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#8e9297', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8e9297', font: { size: 10 } } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// 3. Event Specific - Record Distribution (히스토그램)
function renderRecordDistributionChart(solves = []) {
  const ctx = document.getElementById('record-distribution-chart');
  if (!ctx) return;

  const labels = ['8s~', '9s~', '10s~', '11s~', '12s~', '13s~', '14s+'];
  const distributionData = [15, 45, 120, 180, 95, 30, 15];

  if (recordDistChart) recordDistChart.destroy();

  recordDistChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets:
