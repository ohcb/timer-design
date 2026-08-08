// timer.js

import { getCurrentSession, saveCurrentSession } from './session-manager.js';
import { renderSolvesList } from './solves.js';
import { openSolveBottomSheet } from './solve-bottom-sheet.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;

// 1. 시간 포맷팅 헬퍼
export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  
  let totalMs = ms || 0;
  if (penalty === '+2') totalMs += 2000;

  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 2. 통계 계산 헬퍼
function calculateAverage(solves, count) {
  if (!solves || solves.length < count) return '-';
  const slice = solves.slice(0, count);
  
  const dnfCount = slice.filter(s => s.penalty === 'DNF').length;
  if (dnfCount > 1) return 'DNF';

  const times = slice.map(s => {
    if (s.penalty === 'DNF') return Infinity;
    return s.time + (s.penalty === '+2' ? 2000 : 0);
  });

  if (count >= 5) {
    times.sort((a, b) => a - b);
    times.pop();
    times.shift();
  }

  const sum = times.reduce((acc, cur) => acc + cur, 0);
  return (sum / times.length / 1000).toFixed(2);
}

// 3. Current & Best 통계 렌더링
export function renderStats() {
  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  const timerSummary = document.querySelector('.timer-summary');
  const curAo5 = calculateAverage(solves, 5);
  const curAo12 = calculateAverage(solves, 12);

  if (timerSummary) {
    timerSummary.innerHTML = `
      <div>ao5: ${curAo5} ao12: ${curAo12}</div>
    `;
    timerSummary.style.userSelect = 'none';
    timerSummary.style.webkitUserSelect = 'none';
  }

  const statsTable = document.querySelector('.stats-table');
  if (!statsTable) return;

  const curSingle = solves.length > 0 ? formatTime(solves[0].time, solves[0].penalty) : '-';
  
  const validSolves = solves.filter(s => s.penalty !== 'DNF');
  let bestSingle = '-';
  if (validSolves.length > 0) {
    const bestMs = Math.min(...validSolves.map(s => s.time + (s.penalty === '+2' ? 2000 : 0)));
    bestSingle = (bestMs / 1000).toFixed(2);
  }

  statsTable.innerHTML = `
    <div class="row header"><span class="stat-type"></span> <span>Cur</span> <span>Best</span></div>
    <div class="row"><span class="stat-type">time</span> <span>${curSingle}</span> <span>${bestSingle}</span></div>
    <div class="row"><span class="stat-type">mo3</span> <span>${calculateAverage(solves, 3)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao5</span> <span>${curAo5}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao12</span> <span>${curAo12}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao25</span> <span>${calculateAverage(solves, 25)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao50</span> <span>${calculateAverage(solves, 50)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao100</span> <span>${calculateAverage(solves, 100)}</span> <span>-</span></div>
  `;
}

// 4. Recent Solves 목록 렌더링
export function renderRecentSolves() {
  const container = document.querySelector('.recent-solves .solve-list') || 
                    document.querySelector('.solve-list');

  if (!container) return;

  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = '<li style="color:#64748b; font-size:14px; padding: 4px 0;">기록 없음</li>';
    return;
  }

  const recent = solves.slice(0, 5);

  container.style.display = 'block';
  container.style.visibility = 'visible';
  container.style.opacity = '1';

  container.innerHTML = recent
    .map((s, idx) => {
      const num = recent.length - idx;
      const formattedTime = formatTime(s.time, s.penalty);
      return `<li data-id="${s.id}" class="recent-solve-item" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; cursor: pointer; user-select: none; -webkit-user-select: none;">
        <span class="num" style="color: #64748b; margin-right: 8px; pointer-events: none;">${num}.</span> 
        <span style="font-weight: 600; color: #f8fafc; pointer-events: none;">${formattedTime}</span>
      </li>`;
    })
    .join('');
}

// 5. 메인 타이머 초기화
export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) return;

  const timerZone = timerDisplay.closest('.timer-zone') || timerDisplay.parentElement;
  if (timerZone) {
    timerZone.style.userSelect = 'none';
    timerZone.style.webkitUserSelect = 'none';
    timerZone.style.webkitTouchCallout = 'none';
  }

  timerDisplay.style.userSelect = 'none';
  timerDisplay.style.webkitUserSelect = 'none';

  setTimeout(() => {
    renderRecentSolves();
    renderStats();
  }, 100);

  function updateDisplay(ms) {
    timerDisplay.textContent = (ms / 1000).toFixed(2);
  }

  function startTimer() {
    isRunning = true;
    startTime = performance.now();
    timerDisplay.style.color = '#ffffff';

    function tick() {
      if (!isRunning) return;
      elapsedTime = performance.now() - startTime;
      updateDisplay(elapsedTime);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function stopTimer() {
    isRunning = false;
    timerDisplay.style.color = '';

    const session = getCurrentSession();
    if (session) {
      if (!session.solves) session.solves = [];

      const scrambleText = document.querySelector('.scramble-text')?.textContent || '';
      
      const newSolve = {
        id: Date.now(),
        time: Math.round(elapsedTime),
        penalty: 'NONE',
        createdAt: Date.now(),
        scramble: scrambleText,
        note: '',
        isBookmarked: false
      };

      session.solves.unshift(newSolve);
      saveCurrentSession(session);
    }

    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  // 최근 기록 클릭시 바텀시트 열기
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.recent-solve-item, [data-id]');
    if (item) {
      const solveId = item.getAttribute('data-id');
      if (solveId) {
        if (typeof openSolveBottomSheet === 'function') {
          openSolveBottomSheet(solveId);
        } else if (window.openSolveBottomSheet) {
          window.openSolveBottomSheet(solveId);
        }
      }
    }
  });

  // 💡 입력 이벤트 핸들러
  function isBottomSheetOpen() {
    const sheet = document.getElementById('detail-bottom-sheet');
    return sheet && (sheet.classList.contains('open') || sheet.classList.contains('active'));
  }

  function handlePressStart(e) {
    // 💡 바텀시트가 열려있을 때 바깥을 터치하면 타이머 실행 금지
    if (isBottomSheetOpen()) {
      return;
    }

    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, #detail-bottom-sheet, .bottom-sheet, .recent-solve-item, .recent-solves, .solve-list, [data-id]')) {
      return;
    }

    if (isRunning) {
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444';
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e';
    }, 300);
  }

  function handlePressEnd(e) {
    // 💡 바텀시트 열려있을 땐 터치 종료도 무시
    if (isBottomSheetOpen()) {
      return;
    }

    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, #detail-bottom-sheet, .bottom-sheet, .recent-solve-item, .recent-solves, .solve-list, [data-id]')) {
      return;
    }

    clearTimeout(holdTimeout);

    if (isRunning) return;

    if (isReady) {
      startTimer();
    } else {
      timerDisplay.style.color = '';
    }
    isReady = false;
  }

  document.addEventListener('touchstart', handlePressStart, { passive: true });
  document.addEventListener('touchend', handlePressEnd);

  document.addEventListener('mousedown', (e) => { if (e.button === 0) handlePressStart(e); });
  document.addEventListener('mouseup', (e) => { if (e.button === 0) handlePressEnd(e); });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      handlePressStart();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handlePressEnd();
    }
  });
}
