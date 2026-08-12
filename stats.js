// stats.js

import { getSessions, getCurrentSessionId } from './session-manager.js';
import { getSolveEvent } from './event.js';
import { calculateAoN, getBestTime } from './stats-calculator.js';

let distributionChart = null;
let timeProgressChart = null;
let recordDistChart = null;
let selectedMobileEvent = null;
let currentChartType = 'single';

// Stats 탭 자체 종목 드롭다운(Overview/2x2/3x3/4x4/5x5/OH)의 짧은 코드를
// 실제 solve.event 값(WCA 종목 코드)으로 매핑
const STATS_EVENT_CODE_MAP = {
  '2x2': '222',
  '3x3': '333',
  '4x4': '444',
  '5x5': '555',
  'oh': '333oh'
};

const ALL_SESSIONS_VALUE = '__all__';

// ==========================================
// 0. 데이터 소스 헬퍼
// ==========================================

// 삭제되지 않은 모든 세션의 solves를 세션 정보와 함께 평탄화
function getAllSolvesFlat() {
  const sessions = getSessions({}); // active + completed (deleted 제외)
  const flat = [];
  sessions.forEach(session => {
    (session.solves || []).forEach(solve => {
      flat.push({
        ...solve,
        event: getSolveEvent(solve),
        sessionId: session.id,
        sessionName: session.name
      });
    });
  });
  return flat;
}

// 특정 세션(또는 전체) + 특정 종목으로 필터링된 solves (최신순 유지)
function getFilteredSolves(sessionValue, eventId) {
  const all = getAllSolvesFlat();
  const bySession = sessionValue === ALL_SESSIONS_VALUE
    ? all
    : all.filter(s => String(s.sessionId) === String(sessionValue));

  return bySession
    .filter(s => s.event === eventId)
    .sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));
}

// Range(Scope) 필터 적용 — 입력은 최신순 정렬된 배열이라고 가정
function applyScopeFilter(solves, scope) {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (scope) {
    case 'recent50': return solves.slice(0, 50);
    case 'recent100': return solves.slice(0, 100);
    case 'recent500': return solves.slice(0, 500);
    case 'recent1000': return solves.slice(0, 1000);
    case 'today':
      return solves.filter(s => (s.createdAt || s.id) >= startOfToday.getTime());
    case '7days':
      return solves.filter(s => (s.createdAt || s.id) >= now - 7 * 24 * 60 * 60 * 1000);
    case 'all':
    default:
      return solves;
  }
}

// ==========================================
// 1. 초기화
// ==========================================

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
    scopeSelect.addEventListener('change', () => {
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
      updateEventStatsData();
    });
  });

  // 5. 세션/종목이 앱 다른 곳에서 바뀌면(세션 전환, 종목 변경) 현재 보고 있는 통계도 갱신
  document.addEventListener('cub3:event-changed', () => {
    if (isEventViewActive()) updateEventStatsData();
  });

  // 6. 초기 화면 설정 (기본 overview 활성화)
  switchEventView('overview');
}

function isEventViewActive() {
  const viewEvent = document.getElementById('stats-view-event');
  return viewEvent && viewEvent.style.display !== 'none';
}

// 🎯 화면 전환 통합 제어 함수
function switchEventView(eventName) {
  const eventBtn = document.getElementById('stats-event-btn');
  const viewOverview = document.getElementById('stats-view-overview');
  const viewEvent = document.getElementById('stats-view-event');
  const options = document.querySelectorAll('.stats-option');

  options.forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-event') === eventName);
  });

  const activeOption = Array.from(options).find(opt => opt.getAttribute('data-event') === eventName);
  if (eventBtn) {
    eventBtn.textContent = activeOption ? activeOption.textContent : 'Overview';
  }

  if (eventName === 'overview') {
    if (viewOverview) viewOverview.style.setProperty('display', 'flex', 'important');
    if (viewEvent) viewEvent.style.setProperty('display', 'none', 'important');
    renderDistributionChart();
  } else {
    if (viewOverview) viewOverview.style.setProperty('display', 'none', 'important');
    if (viewEvent) viewEvent.style.setProperty('display', 'flex', 'important');

    populateSessionSelect();
    updateEventStatsData();
  }
}

// 현재 Stats 화면에서 선택된 종목의 실제 event id ('3x3' -> '333')
function getSelectedStatsEventId() {
  const activeOption = document.querySelector('.stats-option.active');
  const code = activeOption ? activeOption.getAttribute('data-event') : '3x3';
  return STATS_EVENT_CODE_MAP[code] || '333';
}

// Session 드롭다운을 실제 세션 목록으로 채움 ("전체 세션" 옵션 포함)
function populateSessionSelect() {
  const sessionSelect = document.getElementById('stats-session-select');
  if (!sessionSelect) return;

  const sessions = getSessions({});
  const currentValue = sessionSelect.value;
  const currentSessionId = getCurrentSessionId();

  const optionsHtml = [
    `<option value="${ALL_SESSIONS_VALUE}">전체 세션</option>`,
    ...sessions.map(s => `<option value="${s.id}">${s.name}</option>`)
  ].join('');

  sessionSelect.innerHTML = optionsHtml;

  // 이전에 선택돼있던 세션이 아직 존재하면 유지, 아니면 현재 세션으로 기본 설정
  const stillExists = sessions.some(s => String(s.id) === String(currentValue));
  sessionSelect.value = stillExists ? currentValue : (currentSessionId || ALL_SESSIONS_VALUE);
}

// ==========================================
// 📊 Overview: 종목 분포 차트
// ==========================================

function renderDistributionChart() {
  const ctx = document.getElementById('distribution-chart');
  if (!ctx) return;

  const isMobile = window.innerWidth <= 600;
  const allSolves = getAllSolvesFlat();

  const c333 = allSolves.filter(s => s.event === '333').length;
  const c222 = allSolves.filter(s => s.event === '222').length;
  const c444 = allSolves.filter(s => s.event === '444').length;
  const cOh = allSolves.filter(s => s.event === '333oh').length;
  const total = allSolves.length;
  const others = total - (c333 + c222 + c444 + cOh);

  // 전체 활동 요약 (Total Solves / Total Time)도 여기서 같이 갱신
  const totalTimeMs = allSolves.reduce((sum, s) => sum + (s.time || 0), 0);
  const totalTimeSec = Math.floor(totalTimeMs / 1000);
  const hours = Math.floor(totalTimeSec / 3600);
  const minutes = Math.floor((totalTimeSec % 3600) / 60);

  const activityValues = document.querySelectorAll('#stats-view-overview .activity-value');
  if (activityValues[0]) activityValues[0].textContent = total.toLocaleString();
  if (activityValues[1]) activityValues[1].textContent = `${hours}h ${minutes}m`;

  if (total === 0) {
    if (distributionChart) { distributionChart.destroy(); distributionChart = null; }
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }

  const chartData = {
    labels: ['3x3', '2x2', '4x4', 'OH', 'Others'],
    datasets: [{
      data: [c333, c222, c444, cOh, others],
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
        const percentage = total > 0 ? Math.round((solveCount / total) * 100) : 0;

        if (clickedEvent === 'Others') return;

        const eventDataMap = { '3x3': '3x3', '2x2': '2x2', '4x4': '4x4', 'OH': 'oh' };
        const statsCode = eventDataMap[clickedEvent];

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
            viewBtn.onclick = () => switchEventView(statsCode);
          }
        } else {
          switchEventView(statsCode);
        }
      }
    }
  });
}

// ==========================================
// 📊 종목별 뷰: 차트 렌더링
// ==========================================

// solves(ms 단위, penalty 포함)를 초 단위 유효 시간 배열로 변환 (DNF 제외, +2 반영)
function toValidSeconds(solves) {
  return solves
    .filter(s => s.penalty !== 'DNF')
    .map(s => (s.time / 1000) + (s.penalty === '+2' ? 2 : 0));
}

// 종목/세션 기준 시간 흐름에 따른 평균 추이 데이터 생성
// chronoSolves: 오래된 순서
function buildProgressSeries(chronoSolves, type) {
  if (type === 'single') {
    const points = [];
    chronoSolves.forEach((s) => {
      if (s.penalty === 'DNF') return;
      const sec = (s.time / 1000) + (s.penalty === '+2' ? 2 : 0);
      points.push(sec);
    });
    return points;
  }

  const n = { mo3: 3, ao5: 5, ao12: 12, ao100: 100 }[type] || 5;
  const points = [];
  for (let i = 0; i <= chronoSolves.length - n; i++) {
    const window = chronoSolves.slice(i, i + n);
    const avg = calculateAoN(window, n);
    if (avg === null || avg === 'DNF') continue;
    points.push(avg / 1000);
  }
  return points;
}

function renderTimeProgressChart(chronoSolves = []) {
  const ctx = document.getElementById('time-progress-chart');
  if (!ctx) return;

  const points = buildProgressSeries(chronoSolves, currentChartType);
  const labels = points.map((_, i) => `#${i + 1}`);

  if (timeProgressChart) timeProgressChart.destroy();

  timeProgressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${currentChartType.toUpperCase()} Progress`,
        data: points,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: points.length > 60 ? 0 : 3,
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

function buildHistogram(times, bucketCount = 7) {
  if (times.length === 0) return { labels: [], data: [] };

  const min = Math.min(...times);
  const max = Math.max(...times);

  if (min === max) {
    return { labels: [`${min.toFixed(1)}s`], data: [times.length] };
  }

  const bucketSize = (max - min) / bucketCount;
  const buckets = new Array(bucketCount).fill(0);

  times.forEach(t => {
    let idx = Math.floor((t - min) / bucketSize);
    if (idx >= bucketCount) idx = bucketCount - 1;
    buckets[idx]++;
  });

  const labels = buckets.map((_, i) => `${(min + i * bucketSize).toFixed(1)}s+`);
  return { labels, data: buckets };
}

function renderRecordDistributionChart(solves = []) {
  const ctx = document.getElementById('record-distribution-chart');
  if (!ctx) return;

  const times = toValidSeconds(solves);
  const { labels, data } = buildHistogram(times);

  if (recordDistChart) recordDistChart.destroy();

  recordDistChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Solves Count',
        data,
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

// Percent Under 12s 등 목표 시간. 별도 설정 UI가 아직 없어 상수로 유지.
const SUB_TARGET_SECONDS = 12.0;

function calculateAndRenderStatistics(solvesData, subTargetTime = SUB_TARGET_SECONDS) {
  const totalCount = solvesData.length;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  if (totalCount === 0) {
    ['stat-mean', 'stat-median', 'stat-sd', 'stat-p10', 'stat-p25', 'stat-p75', 'stat-p90']
      .forEach(id => setText(id, '-'));
    setText('stat-sub-rate', '-');
    setText('stat-sub-streak', '-');
    setText('stat-total-solves', '0');
    setText('stat-total-time', '0m 0s');

    ['bar-ok', 'bar-p2', 'bar-dnf'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.width = '0%';
    });
    setText('val-ok', '0 (0%)');
    setText('val-p2', '0 (0%)');
    setText('val-dnf', '0 (0%)');
    return;
  }

  const validTimes = solvesData
    .filter(s => s.penalty !== 'DNF')
    .map(s => (s.time / 1000) + (s.penalty === '+2' ? 2 : 0))
    .sort((a, b) => a - b);

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
    const finalTime = (s.time / 1000) + (s.penalty === '+2' ? 2 : 0);
    if (s.penalty !== 'DNF' && finalTime < subTargetTime) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const p2Count = solvesData.filter(s => s.penalty === '+2').length;
  const dnfCount = solvesData.filter(s => s.penalty === 'DNF').length;
  const okCount = totalCount - p2Count - dnfCount;

  const okPct = ((okCount / totalCount) * 100).toFixed(0);
  const p2Pct = ((p2Count / totalCount) * 100).toFixed(0);
  const dnfPct = ((dnfCount / totalCount) * 100).toFixed(0);

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

// Personal Best는 Range 필터와 무관하게 항상 해당 세션+종목의 전체 기록 기준
function renderPersonalBest(fullSolves) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const formatMs = (ms) => (ms / 1000).toFixed(2) + 's';

  const chronoSolves = [...fullSolves].reverse(); // 오래된 순

  const rollingBest = (n) => {
    if (chronoSolves.length < n) return null;
    let best = null;
    for (let i = 0; i <= chronoSolves.length - n; i++) {
      const avg = calculateAoN(chronoSolves.slice(i, i + n), n);
      if (avg === null || avg === 'DNF') continue;
      if (best === null || avg < best) best = avg;
    }
    return best;
  };

  const pbSingle = getBestTime(fullSolves);
  const pbMo3 = rollingBest(3);
  const pbAo5 = rollingBest(5);
  const pbAo12 = rollingBest(12);
  const pbAo100 = rollingBest(100);

  setText('pb-single', pbSingle !== null ? formatMs(pbSingle) : '-');
  setText('pb-mo3', pbMo3 !== null ? formatMs(pbMo3) : '-');
  setText('pb-ao5', pbAo5 !== null ? formatMs(pbAo5) : '-');
  setText('pb-ao12', pbAo12 !== null ? formatMs(pbAo12) : '-');
  setText('pb-ao100', pbAo100 !== null ? formatMs(pbAo100) : '-');
}

// ==========================================
// 🔄 종목별 뷰 전체 갱신 진입점
// ==========================================

function updateEventStatsData() {
  const scopeSelect = document.getElementById('stats-scope-select');
  const sessionSelect = document.getElementById('stats-session-select');

  const eventId = getSelectedStatsEventId();
  const sessionValue = sessionSelect ? sessionSelect.value : ALL_SESSIONS_VALUE;
  const scope = scopeSelect ? scopeSelect.value : 'all';

  // 전체(all-time) 목록: PB 계산용, Range 필터 영향 없음
  const fullSolves = getFilteredSolves(sessionValue, eventId);

  // Range로 좁힌 목록: 차트/Statistics/Penalties용
  const scopedSolves = applyScopeFilter(fullSolves, scope);
  const chronoSolves = [...scopedSolves].reverse(); // 오래된 순

  renderTimeProgressChart(chronoSolves);
  renderRecordDistributionChart(scopedSolves);
  calculateAndRenderStatistics(scopedSolves);
  renderPersonalBest(fullSolves);
}
