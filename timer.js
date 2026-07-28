// timer.js

import { saveToStorage, loadFromStorage, getSolves } from './storage.js';
import { renderSolvesList } from './solves.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;

export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  let totalMs = ms;
  if (penalty === '+2') totalMs += 2000;
  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 💡 타이머 화면 하단 최근 기록 렌더링
export function renderRecentSolves() {
  const container = document.getElementById('recent-solves') || document.querySelector('.recent-solves-list');
  if (!container) return;

  const solves = getSolves();
  if (!solves || solves.length === 0) {
    container.innerHTML = '<div style="color:#64748b; font-size:14px;">최근 기록이 없습니다.</div>';
    return;
  }

  // 최신 5개 기록 추출
  const recent = solves.slice().sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id)).slice(0, 5);

  container.innerHTML = recent
    .map(s => `<span class="recent-solve-item" style="margin: 0 6px; font-weight: 500;">${formatTime(s.time, s.penalty)}</span>`)
    .join('');
}

export function renderStats() {
  // 메인 화면 통계 영역(ao5, ao12 등)이 있다면 연동
}

export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) return;

  // 처음 로드 시 타이머 하단 최근 기록 그리기
  renderRecentSolves();

  function updateDisplay(timeMs) {
    const sec = (timeMs / 1000).toFixed(2);
    timerDisplay.textContent = sec;
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

    try {
      const sessions = loadFromStorage('cub3_sessions') || [];
      const currentSessionId = loadFromStorage('cub3_current_session_id');
      
      let activeSession = sessions.find(s => String(s.id) === String(currentSessionId)) || sessions[0];

      if (activeSession) {
        activeSession.solves = activeSession.solves || [];
        
        const newSolve = {
          id: Date.now(),
          time: Math.round(elapsedTime),
          penalty: 'NONE',
          createdAt: Date.now(),
          scramble: document.querySelector('.scramble-text')?.textContent || '',
          note: '',
          isBookmarked: false
        };

        activeSession.solves.unshift(newSolve);
        saveToStorage('cub3_sessions', sessions);
      }
    } catch (e) {
      console.error('저장 오류:', e);
    }

    // 💡 저장 후 타이머 화면과 솔브 탭 UI 모두 즉시 갱신
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  function handlePressStart(e) {
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) return;

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
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) return;

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
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); handlePressStart(); }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') { e.preventDefault(); handlePressEnd(); }
  });
}
