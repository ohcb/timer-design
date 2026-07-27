// timer.js

import { addSolve, getActiveSession } from './storage.js';

export function formatTime(ms) {
  if (ms == null || Number.isNaN(ms)) return '0.00';
  const total = ms / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}

// 💡 Recent Solves (HTML) 리스트를 로컬스토리지 데이터로 갱신하는 함수
function renderRecentSolves() {
  const solveList = document.querySelector('.solve-list');
  if (!solveList) return;

  const session = getActiveSession();
  const recentSolves = session.solves.slice(0, 5); // 최근 5개만 가져오기

  // 저장된 기록이 없을 때
  if (recentSolves.length === 0) {
    solveList.innerHTML = '<li><span class="num">-</span> 기록 없음</li>';
    return;
  }

  // HTML 동적 생성 (고정되어 있던 HTML 태그를 진짜 데이터로 교체!)
  solveList.innerHTML = recentSolves
    .map((solve, index) => {
      const num = recentSolves.length - index;
      return `<li><span class="num">${num}.</span> ${formatTime(solve.time)}</li>`;
    })
    .join('');
}

export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display');
  const timerZone = document.querySelector('.timer-zone') || timerDisplay;
  
  if (!timerDisplay) {
    console.error("타이머 디스플레이(.timer-display) 태그를 찾을 수 없습니다.");
    return;
  }

  // 💡 앱 처음 켜졌을 때 기존 저장되어 있던 기록들 화면에 바로 띄우기!
  renderRecentSolves();

  let mode = 'idle'; // 'idle' | 'holding' | 'ready' | 'running'
  let startAt = 0;
  let rafId = 0;
  let holdTimer = null;
  const READY_DELAY_MS = 300; // 0.3초 홀드

  function setMode(nextMode) {
    mode = nextMode;

    if (nextMode === 'holding') {
      timerDisplay.style.color = '#ef4444';
    } else if (nextMode === 'ready') {
      timerDisplay.style.color = '#22c55e';
    } else if (nextMode === 'running') {
      timerDisplay.style.color = '#ffffff';
    } else {
      timerDisplay.style.color = '';
    }
  }

  function handlePressStart() {
    if (mode === 'running') {
      stopTimer();
      return;
    }
    if (mode !== 'idle') return;

    setMode('holding');

    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      setMode('ready');
    }, READY_DELAY_MS);
  }

  function handlePressEnd() {
    if (mode === 'ready') {
      startTimer();
    } else if (mode === 'holding') {
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

    if (mode === 'running') {
      rafId = requestAnimationFrame(tick);
    }
  }

  function stopTimer() {
    cancelAnimationFrame(rafId);
    const timeMs = Math.round(performance.now() - startAt);
    setMode('idle');
    timerDisplay.textContent = formatTime(timeMs);

    // 1. Storage에 저장
    addSolve(timeMs);

    // 2. 💡 저장하자마자 HTML 화면 Recent Solves 즉시 갱신!
    renderRecentSolves();
  }

  // --- 이벤트 리스너 (키보드, 터치, 마우스) ---
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      handlePressStart();
    }
    if (e.code === 'Escape') {
      clearTimeout(holdTimer);
      cancelAnimationFrame(rafId);
      setMode('idle');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      handlePressEnd();
    }
  });

  timerZone.style.cursor = 'pointer';

  timerZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePressStart();
  }, { passive: false });

  timerZone.addEventListener('touchend', (e) => {
    e.preventDefault();
    handlePressEnd();
  });

  timerZone.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    handlePressStart();
  });

  timerZone.addEventListener('mouseup', (e) => {
    handlePressEnd();
  });
}
