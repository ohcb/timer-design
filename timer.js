// timer.js

import { 
  getCurrentSession, 
  addSolveToCurrentSession 
} from './session-manager.js';

import { 
  updateSolvePenalty, 
  deleteSolve 
} from './storage.js';

import { getBestTime, calculateAoN } from './stats-calculator.js';
import { renderSolvesList } from './solves.js'; // 💡 Solves 탭 리스트 연동

// 시간 표시 포맷 (패널티 고려: 0, 2000, 'DNF')
export function formatTime(ms, penalty = 0) {
  if (penalty === 'DNF') return 'DNF';
  if (ms == null || Number.isNaN(ms)) return '0.00';

  const penaltyMs = (penalty === '+2' || penalty === 2000) ? 2000 : 0;
  const finalMs = ms + penaltyMs;
  const total = finalMs / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  
  const formatted = minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);

  return penaltyMs > 0 ? `${formatted}+` : formatted;
}

// Recent Solves 리스트 그려주기 (현재 활성 세션 기준)
export function renderRecentSolves() {
  const solveList = document.querySelector('.solve-list');
  if (!solveList) return;

  const currentSession = getCurrentSession();
  const solves = currentSession ? currentSession.solves : [];
  
  // 최근 5개 기록 (최신순)
  const recentSolves = solves.slice().reverse().slice(0, 5);

  if (recentSolves.length === 0) {
    solveList.innerHTML = '<li><span class="num">-</span> 기록 없음</li>';
    return;
  }

  solveList.innerHTML = recentSolves
    .map((solve, index) => {
      const num = solves.length - index;
      const displayTime = formatTime(solve.time, solve.penalty);
      return `<li data-id="${solve.id}"><span class="num">${num}.</span> ${displayTime}</li>`;
    })
    .join('');
}

// Current & Best 통계 표 갱신
export function renderStats() {
  const currentSession = getCurrentSession();
  const solves = currentSession ? currentSession.solves : [];

  const curSolve = solves.length > 0 ? solves[solves.length - 1] : null;
  const curTime = curSolve ? curSolve.time : null;
  const curPenalty = curSolve ? curSolve.penalty : 0;
  
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

  // row[1]: time (최근 기록)
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
    const currentSession = getCurrentSession();
    const solves = currentSession ? currentSession.solves : [];
    const target = solves.find(s => String(s.id) === String(id));
    if (!target) return;

    activeSolveId = id;
    modalTimeEl.textContent = formatTime(target.time, target.penalty);

    penaltyBtns.forEach(btn => {
      const p = btn.dataset.penalty; // '0', '2000', 'DNF' 등
      if (String(target.penalty || 0) === String(p)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    modal.style.display = 'flex';
  }

  function closeModal() {
    if (modal) modal.style.display = 'none';
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
      const penalty = btn.dataset.penalty; // 0, 2000, 'DNF'
      
      updateSolvePenalty(activeSolveId, penalty);
      
      closeModal();
      renderRecentSolves();
      renderStats();
      if (typeof renderSolvesList === 'function') renderSolvesList();
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
      if (typeof renderSolvesList === 'function') renderSolvesList();
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

    // 💡 현재 활성 세션에 스크램블과 함께 기록 추가
    const currentScramble = document.getElementById('scramble-text')?.textContent || '';
    addSolveToCurrentSession(timeMs, 0, currentScramble);

    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') renderSolvesList();
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
