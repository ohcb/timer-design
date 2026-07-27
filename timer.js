// timer.js

import { addSolve, getSolves, updateSolvePenalty, deleteSolve } from './storage.js';
import { getBestTime, calculateAoN } from './stats-calculator.js';
import { renderSolvesList } from './solves.js'; // 💡 Solves 탭 리스트 연동 추가

// 시간 표시 포맷 (패널티 고려)
export function formatTime(ms, penalty = 'NONE') {
  if (penalty === 'DNF') return 'DNF';
  if (ms == null || Number.isNaN(ms)) return '0.00';

  const finalMs = penalty === '+2' ? ms + 2000 : ms;
  const total = finalMs / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  
  const formatted = minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);

  return penalty === '+2' ? `${formatted}+` : formatted;
}

// Recent Solves 리스트 그려주기 (data-id 할당)
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
      const displayTime = formatTime(solve.time, solve.penalty);
      return `<li data-id="${solve.id}"><span class="num">${num}.</span> ${displayTime}</li>`;
    })
    .join('');
}

// Current & Best 통계 표 갱신
export function renderStats() {
  const solves = getSolves();

  const curTime = solves.length > 0 ? solves[0].time : null;
  const curPenalty = solves.length > 0 ? solves[0].penalty : 'NONE';
  const bestSingle = getBestTime(solves);

  const curAo5 = calculateAoN(solves, 5);
  const curAo12 = calculateAoN(solves, 12);

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

  const rows = document.querySelectorAll('.stats-table .row');
  if (!rows || rows.length < 5) return;

  const updateRow = (rowIndex, curVal, bestVal) => {
    const spans = rows[rowIndex]?.querySelectorAll('span');
    if (spans && spans.length >= 3) {
      spans[1].textContent = curVal ? (typeof curVal === 'number' ? formatTime(curVal) : curVal) : '-';
      spans[2].textContent = bestVal ? (typeof bestVal === 'number' ? formatTime(bestVal) : bestVal) : '-';
    }
  };

  // row[1]: time (최근 기록은 패널티 반영)
  const curTimeDisplay = curTime !== null ? formatTime(curTime, curPenalty) : null;
  const bestTimeDisplay = bestSingle !== null ? formatTime(bestSingle) : null;
  updateRow(1, curTimeDisplay, bestTimeDisplay);

  // row[3]: ao5
  updateRow(3, curAo5, bestAo5);

  // row[4]: ao12
  updateRow(4, curAo12, bestAo12);
}

// 💡 모달 이벤트 및 관리 로직
function initSolveModal() {
  const modal = document.getElementById('solve-modal');
  const solveList = document.querySelector('.solve-list');
  const closeBtn = document.getElementById('modal-close');
  const deleteBtn = document.getElementById('modal-delete-btn');
  const penaltyBtns = document.querySelectorAll('.penalty-btn');
  const modalTimeEl = document.getElementById('modal-solve-time');

  let activeSolveId = null;

  function openModal(id) {
    const solves = getSolves();
    const target = solves.find(s => s.id === id);
    if (!target) return;

    activeSolveId = id;
    modalTimeEl.textContent = formatTime(target.time, target.penalty);

    penaltyBtns.forEach(btn => {
      const p = btn.dataset.penalty;
      if ((target.penalty || 'NONE') === p) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    modal.style.display = 'flex';
  }

  function closeModal() {
    modal.style.display = 'none';
    activeSolveId = null;
  }

  if (solveList) {
    solveList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li && li.dataset.id) {
        openModal(li.dataset.id);
      }
    });
  }

  // 패널티 변경 클릭
  penaltyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeSolveId) return;
      const penalty = btn.dataset.penalty;
      
      updateSolvePenalty(activeSolveId, penalty);
      
      closeModal();
      renderRecentSolves();
      renderStats();
      if (typeof renderSolvesList === 'function') renderSolvesList(); // 💡 Solves 탭도 갱신
    });
  });

  // 기록 삭제 클릭
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeSolveId) return;
      
      deleteSolve(activeSolveId);
      
      closeModal();
      renderRecentSolves();
      renderStats();
      if (typeof renderSolvesList === 'function') renderSolvesList(); // 💡 Solves 탭도 갱신
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}

export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display');
  const timerZone = document.querySelector('.timer-zone') || timerDisplay;

  if (!timerDisplay) return;

  renderRecentSolves();
  renderStats();
  initSolveModal();

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

    addSolve(timeMs);
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') renderSolvesList(); // 💡 Solves 탭 갱신
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
