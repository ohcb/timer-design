// timer.js

import { getCurrentSession, saveCurrentSession } from './session-manager.js';
import { renderSolvesList } from './solves.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;

// 1. 포맷팅 헬퍼 (모듈 공용)
export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  
  let totalMs = ms || 0;
  if (penalty === '+2') totalMs += 2000;

  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 2. 타이머 화면 Recent Solves (<ul class="solve-list">) 렌더링
export function renderRecentSolves() {
  // HTML 구조에 맞춰 .recent-solves 안의 .solve-list 탐색
  const container = document.querySelector('.recent-solves .solve-list') || 
                    document.querySelector('.solve-list') ||
                    document.getElementById('recent-solves');

  if (!container) return;

  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = '<li style="color:#64748b; font-size:14px; text-align:center;">기록 없음</li>';
    return;
  }

  // 최신 5개 기록 추출
  const recent = solves.slice(0, 5);

  // HTML 구조(<li><span class="num">1.</span> 8.95</li>)에 맞춰 HTML 생성
  container.innerHTML = recent
    .map((s, idx) => {
      const num = recent.length - idx; // 번호 부여 (5, 4, 3, 2, 1 순)
      const formattedTime = formatTime(s.time, s.penalty);
      return `<li><span class="num">${num}.</span> ${formattedTime}</li>`;
    })
    .join('');
}

// 3. 타이머 화면 통계 (ao5, ao12 등) 렌더링
export function renderStats() {
  // 필요시 통계 계산 로직 구현
}

// 4. 메인 타이머 초기화 함수
export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) {
    console.error('❌ 타이머 표시 요소를 찾지 못했습니다.');
    return;
  }

  // 최초 로드 시 최근 기록 표시
  renderRecentSolves();

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

    // 💡 1. 현재 활성화된 세션에 새로운 측정 결과 추가
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

      // 맨 앞에 추가 (최신순)
      session.solves.unshift(newSolve);
      
      // 세션 저장 실행
      saveCurrentSession(session);
    }

    // 💡 2. 저장 즉시 화면 UI 모두 실시간 갱신
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  // --- 입력 이벤트 처리 ---

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
