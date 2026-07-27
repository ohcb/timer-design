// timer.js

import { addSolve, getSolves } from './storage.js';
import { getBestTime, calculateAoN } from './stats-calculator.js';

export function formatTime(ms) {
  if (ms == null || Number.isNaN(ms) || ms === 'DNF') return 'DNF';
  const total = ms / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}

// Recent Solves 목록 갱신
export function renderRecentSolves() {
  const solveList = document.querySelector('.solve-list');
  if (!solveList) return;

  const solves = getSolves().slice(0, 5);

  if (solves.length === 0) {
    solveList.innerHTML = '<li><span class="num">-</span> 기록 없음</li>';
    return;
  }

  solveList.innerHTML = solves
    .map((solve, index) => {
      const num = solves.length - index;
      return `<li><span class="num">${num}.</span> ${formatTime(solve.time)}</li>`;
    })
    .join('');
}

// timer.js 내 renderStats 함수 수정
export function renderStats() {
  const solves = getSolves(); // 전체 솔브 목록

  // 1. 계산값 구하기
  const curTime = solves.length > 0 ? solves[0].time : null; // 가장 최근
  const bestSingle = getBestTime(solves); // 단일 PB

  const curAo5 = calculateAoN(solves, 5);
  const curAo12 = calculateAoN(solves, 12);

  // 💡 Best ao5 / ao12 계산 (과거 모든 구간 중 최댓값/최솟값 검색)
  let bestAo5 = null;
  if (solves.length >= 5) {
    const ao5List = [];
    for (let i = 0; i <= solves.length - 5; i++) {
      const avg = calculateAoN(solves.slice(i, i + 5), 5);
      if (avg && avg !== 'DNF') ao5List.push(avg);
    }
    if (ao5List.length > 0) bestAo5 = Math.min(...ao5List);
  }

  let bestAo12 = null;
  if (solves.length >= 12) {
    const ao12List = [];
    for (let i = 0; i <= solves.length - 12; i++) {
      const avg = calculateAoN(solves.slice(i, i + 12), 12);
      if (avg && avg !== 'DNF') ao12List.push(avg);
    }
    if (ao12List.length > 0) bestAo12 = Math.min(...ao12List);
  }

  // 2. DOM 요소 매핑 (HTML row 수집)
  const rows = document.querySelectorAll('.stats-table .row');
  if (!rows || rows.length < 5) return;

  // 값 적용 유틸 함수 (row 인덱스, Cur값, Best값)
  const updateRow = (rowIndex, curVal, bestVal) => {
    const spans = rows[rowIndex]?.querySelectorAll('span');
    if (spans && spans.length >= 3) {
      spans[1].textContent = curVal ? formatTime(curVal) : '-';
      spans[2].textContent = bestVal ? formatTime(bestVal) : '-';
    }
  };

  // row[1]: time (Cur, Best)
  updateRow(1, curTime, bestSingle);

  // row[3]: ao5 (Cur, Best)
  updateRow(3, curAo5, bestAo5);

  // row[4]: ao12 (Cur, Best)
  updateRow(4, curAo12, bestAo12);
}



export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display');
  const timerZone = document.querySelector('.timer-zone') || timerDisplay;

  if (!timerDisplay) return;

  // 앱 켜질 때 화면 초기화
  renderRecentSolves();
  renderStats();

  let mode = 'idle';
  let startAt = 0;
  let rafId = 0;
  let holdTimer = null;
  const READY_DELAY_MS = 300;

  function setMode(nextMode) {
    mode = nextMode;
    if (nextMode === 'holding') timerDisplay.style.color = '#ef4444';
    else if (nextMode === 'ready') timerDisplay.style.color = '#22c55e';
    else if (nextMode === 'running') timerDisplay.style.color = '#ffffff';
    else timerDisplay.style.color = '';
  }

  function handlePressStart() {
    if (mode === 'running') {
      stopTimer();
      return;
    }
    if (mode !== 'idle') return;

    setMode('holding');
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { setMode('ready'); }, READY_DELAY_MS);
  }

  function handlePressEnd() {
    if (mode === 'ready') startTimer();
    else if (mode === 'holding') {
      clearTimeout(holdTimer);
      setMode('idle');
    }
  }

  function startTimer() {
    startAt = performance.now();
    setMode('running');
    tick();
  }

  function tick() {
    const elapsed = Math.round(performance.now() - startAt);
    timerDisplay.textContent = formatTime(elapsed);
    if (mode === 'running') rafId = requestAnimationFrame(tick);
  }

  function stopTimer() {
    cancelAnimationFrame(rafId);
    const timeMs = Math.round(performance.now() - startAt);
    setMode('idle');
    timerDisplay.textContent = formatTime(timeMs);

    // 저장 및 화면 갱신
    addSolve(timeMs);
    renderRecentSolves();
    renderStats(); // 💡 통계 표 즉시 업데이트!
  }

  // 이벤트 연결
  timerZone.style.cursor = 'pointer';
  timerZone.addEventListener('touchstart', (e) => { e.preventDefault(); handlePressStart(); }, { passive: false });
  timerZone.addEventListener('touchend', (e) => { e.preventDefault(); handlePressEnd(); });
  timerZone.addEventListener('mousedown', (e) => { if (e.button === 0) handlePressStart(); });
  timerZone.addEventListener('mouseup', () => handlePressEnd());

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); handlePressStart(); }
  });
  window.addEventListener('keyup', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); handlePressEnd(); }
  });
}
