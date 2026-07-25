// stats.js

let distributionChart = null;
let timeProgressChart = null;
let recordDistChart = null;
let selectedMobileEvent = null;
let currentChartType = 'single';

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

  // 4. Time Progress 칩 버튼 이벤트
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chipBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChartType = btn.getAttribute('data-type');
      renderTimeProgressChart();
    });
  });

  // 5. 초기 차트 및 화면 렌더링
  renderDistributionChart();
}

// 📌 [핵심 수정] 내비바를 지켜주는 화면 전환 함수
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

  // display: flex !important 를 제거하고 block / none 으로 단순화
  if (eventName === 'overview') {
    if (viewOverview) viewOverview.style.display = 'block';
    if (viewEvent) viewEvent.style.display = 'none';
  } else {
    if (viewOverview) viewOverview.style.display = 'none';
    if (viewEvent) viewEvent.style.display = 'block';
    
    updateEventStatsData();
  }
}

// ==========================================
// 📊 차트 렌더링 함수들
// ==========================================

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

function renderTimeProgressChart(solves = []) {
  const ctx = document.getElementById('time-progress-chart');
  if (!ctx) return;

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
      datasets: [{
        label: 'Solves Count',
        data: distributionData,
        backgroundColor: '#3b82f6',
        borderRadius: 4
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

// ==========================================
// 🧮 통계 수치 연산 및 DOM 업데이트
// ==========================================

function updateEventStatsData() {
  const dummySolves = [
    { time: 8.56, penalty: 'OK' },
    { time: 10.42, penalty: 'OK' },
    { time: 11.20, penalty: 'OK' },
    { time: 9.80, penalty: 'OK' },
    { time: 12.30, penalty: '+2' },
    { time: 11.45, penalty: 'OK' },
    { time: 0, penalty: 'DNF' },
    { time: 10.10, penalty: 'OK' },
    { time: 13.10, penalty: 'OK' },
    { time: 9.85, penalty: 'OK' }
  ];

  renderTimeProgressChart(dummySolves);
  renderRecordDistributionChart(dummySolves);
  calculateAndRenderStatistics(dummySolves, 12.0);
}

function getQuantile(sortedArr, q) {
  if (sortedArr.length === 0) return 0;
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
}

function calculateAndRenderStatistics(solvesData, subTargetTime = 12.0) {
  const validTimes = solvesData
    .filter(s => s.penalty !== 'DNF')
    .map(s => (s.penalty === '+2' ? s.time + 2 : s.time))
    .sort((a, b) => a - b);

  const totalCount = solvesData.length;
  if (totalCount === 0) return;

  const sum = validTimes.reduce((a, b) => a + b, 0);
  const mean = validTimes.length > 0 ? (sum / validTimes.length).toFixed(2) : '-';
  const median = validTimes.length > 0 ? getQuantile(validTimes, 0.5).toFixed(2) : '-';

  let sd = '-';
  if (validTimes.length > 1) {
    const avg = sum / validTimes.length;
    const variance = validTimes.reduce((acc, cur) => acc + Math.pow(cur - avg, 2), 0) / validTimes.length;
    sd = Math.sqrt(variance).toFixed(2);
  }

  const p10 = validTimes.length > 0 ? getQuantile(validTimes, 0.10).toFixed(2) : '-';
  const p25 = validTimes.length > 0 ? getQuantile(validTimes, 0.25).toFixed(2) : '-';
  const p75 = validTimes.length > 0 ? getQuantile(validTimes, 0.75).toFixed(2) : '-';
  const p90 = validTimes.length > 0 ? getQuantile(validTimes, 0.90).toFixed(2) : '-';

  const subCount = validTimes.filter(t => t < subTargetTime).length;
  const subRate = ((subCount / totalCount) * 100).toFixed(1);

  let maxStreak = 0;
  let currentStreak = 0;
  solvesData.forEach(s => {
    const finalTime = s.penalty === '+2' ? s.time + 2 : s.time;
    if (s.penalty !== 'DNF' && finalTime < subTargetTime) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const okCount = solvesData.filter(s => s.penalty === 'OK').length;
  const p2Count = solvesData.filter(s => s.penalty === '+2').length;
  const dnfCount = solvesData.filter(s => s.penalty === 'DNF').length;

  const okPct = ((okCount / totalCount) * 100).toFixed(0);
  const p2Pct = ((p2Count / totalCount) * 100).toFixed(0);
  const dnfPct = ((dnfCount / totalCount) * 100).toFixed(0);

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('stat-mean', `${mean}s`);
  setText('stat-median', `${median}s`);
  setText('stat-sd', `${sd}s`);
  setText('stat-p10', `${p10}s`);
  setText('stat-p25', `${p25}s`);
  setText('stat-p75', `${p75}s`);
  setText('stat-p90', `${p90}s`);
  setText('stat-sub-rate', `${subRate}% (${subCount})`);
  setText('stat-sub-streak', `${maxStreak} solves 🔥`);
  setText('stat-total-solves', totalCount.toLocaleString());
  setText('stat-total-time', `${Math.floor(sum / 60)}m ${Math.floor(sum % 60)}s`);

  const barOk = document.getElementById('bar-ok');
  const barP2 = document.getElementById('bar-p2');
  const barDnf = document.getElementById('bar-dnf');

  if (barOk) barOk.style.width = `${okPct}%`;
  if (barP2) barP2.style.width = `${p2Pct}%`;
  if (barDnf) barDnf.style.width = `${dnfPct}%`;

  setText('val-ok', `${okCount} (${okPct}%)`);
  setText('val-p2', `${p2Count} (${p2Pct}%)`);
  setText('val-dnf', `${dnfCount} (${dnfPct}%)`);
}
