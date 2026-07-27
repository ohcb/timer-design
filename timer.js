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

// timer.js 안의 renderStats 함수 교체
export function renderStats() {
  const solves = getSolves(); // 전체 솔브 목록

  // 계산 결과값들
  const curTime = solves.length > 0 ? solves[0].time : null; // 가장 최근 기록
  const bestTime = getBestTime(solves); // 전체 PB
  const curAo5 = calculateAoN(solves, 5);
  const curAo12 = calculateAoN(solves, 12);

  // stats-table 내부의 row 행들 찾기
  const rows = document.querySelectorAll('.stats-table .row');
  if (rows.length < 5) return; // 구조가 다르면 중단

  // 1. time 행 (row[1]) -> Cur / Best
  const timeSpans = rows[1].querySelectorAll('span');
  if (timeSpans.length >= 3) {
    timeSpans[1].textContent = curTime ? formatTime(curTime) : '-';
    timeSpans[2].textContent = bestTime ? formatTime(bestTime) : '-';
  }

  // 2. ao5 행 (row[3]) -> Cur
  const ao5Spans = rows[3].querySelectorAll('span');
  if (ao5Spans.length >= 3) {
    ao5Spans[1].textContent = curAo5 ? formatTime(curAo5) : '-';
  }

  // 3. ao12 행 (row[4]) -> Cur
  const ao12Spans = rows[4].querySelectorAll('span');
  if (ao12Spans.length >= 3) {
    ao12Spans[1].textContent = curAo12 ? formatTime(curAo12) : '-';
  }
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
