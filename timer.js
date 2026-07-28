// timer.js

import { getCurrentSession, saveCurrentSession } from './session-manager.js';
import { renderSolvesList } from './solves.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;

// 1. 포맷팅 헬퍼
export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  
  let totalMs = ms || 0;
  if (penalty === '+2') totalMs += 2000;

  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 2. Recent Solves (<ul class="solve-list">) 렌더링
export function renderRecentSolves() {
  // .recent-solves 안의 .solve-list 정밀 탐색
  const container = document.querySelector('.recent-solves .solve-list') || 
                    document.querySelector('.solve-list');

  if (!container) return;

  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = '<li style="color:#64748b; font-size:14px; padding: 4px 0;">기록 없음</li>';
    return;
  }

  // 최신 5개 추출
  const recent = solves.slice(0, 5);

  // HTML 생성 & CSS 스타일 강제 부여 (안 보이는 현상 방지)
  container.style.display = 'block';
  container.style.visibility = 'visible';
  container.style.opacity = '1';

  container.innerHTML = recent
    .map((s, idx) => {
      const num = recent.length - idx;
      const formattedTime = formatTime(s.time, s.penalty);
      return `<li style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px;">
        <span class="num" style="color: #64748b; margin-right: 8px;">${num}.</span> 
        <span style="font-weight: 600; color: #f8fafc;">${formattedTime}</span>
      </li>`;
    })
    .join('');
}

export function renderStats() {
  // 통계 UI 갱신 필요시 구현
}

// 3. 메인 타이머 초기화
export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) return;

  // 로드 즉시 최근 기록 렌더링
  setTimeout(() => {
    renderRecentSolves();
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

    // 💡 세션에 저장
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

    // 💡 화면 즉시 갱신
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  // --- 터치/클릭/스페이스바 이벤트 ---
  function handlePressStart(e) {
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) {
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
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) {
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
