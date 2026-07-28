// timer.js

import { saveToStorage, loadFromStorage } from './storage.js';

let timerInterval = null;
let startTime = 0;
let elapsedTime = 0;
let isRunning = false;
let holdTimeout = null;
let isReady = false;

// 시간을 0.00 형식의 문자열로 변환하는 헬퍼 함수
export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  
  let totalMs = ms;
  if (penalty === '+2') totalMs += 2000;

  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 화면에 최근 기록 반영 (다른 모듈 호환용)
export function renderRecentSolves() {
  const recentEl = document.getElementById('recent-solves');
  if (!recentEl) return;
  // 유연한 처리를 위해 존재할 때만 실행
}

// 화면에 통계 반영 (다른 모듈 호환용)
export function renderStats() {
  const statsEl = document.getElementById('stats-container');
  if (!statsEl) return;
}

export function initTimer() {
  // 💡 HTML의 타이머 글자 요소를 유연하게 탐색 (.timer-display, #timer, .timer 등)
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) {
    console.error('❌ [timer.js] 타이머 표시 요소를 찾을 수 없습니다.');
    return;
  }

  function updateDisplay(timeMs) {
    const sec = (timeMs / 1000).toFixed(2);
    timerDisplay.textContent = sec;
  }

  function startTimer() {
    isRunning = true;
    startTime = performance.now();
    timerDisplay.style.color = '#ffffff'; // 실행 중 흰색

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
    timerDisplay.style.color = ''; // 기본 색상 원복
    
    // 기록 저장 로직 호출 (필요시 추가)
    const currentSessionId = loadFromStorage('cub3_current_session_id');
    const sessions = loadFromStorage('cub3_sessions') || [];
    let activeSession = sessions.find(s => String(s.id) === String(currentSessionId)) || sessions[0];

    if (activeSession) {
      activeSession.solves = activeSession.solves || [];
      activeSession.solves.unshift({
        id: Date.now(),
        time: Math.round(elapsedTime),
        penalty: 'NONE',
        createdAt: Date.now(),
        scramble: document.querySelector('.scramble-text')?.textContent || ''
      });
      saveToStorage('cub3_sessions', sessions);
    }

    // 기록 및 통계 UI 갱신
    if (window.renderSolvesList) window.renderSolvesList();
    renderRecentSolves();
    renderStats();
  }

  // --- Press & Hold 로직 (터치/마우스/키보드 공용) ---

  function handlePressStart(e) {
    // 버튼, 입력창, 세션 탭 등을 누를 때는 타이머 안 동작하게 예외 처리
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card')) {
      return;
    }

    if (isRunning) {
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444'; // 누르고 있을 때 빨간색
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e'; // 준비 완료 초록색
    }, 300);
  }

  function handlePressEnd(e) {
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card')) {
      return;
    }

    clearTimeout(holdTimeout);

    if (isRunning) return;

    if (isReady) {
      startTimer();
    } else {
      timerDisplay.style.color = ''; // 준비 안 됐으면 원복
    }
    isReady = false;
  }

  // 1. 모바일 / 아이패드 터치 이벤트 바인딩
  document.addEventListener('touchstart', handlePressStart, { passive: true });
  document.addEventListener('touchend', handlePressEnd);

  // 2. PC 마우스 이벤트 바인딩
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) handlePressStart(e);
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) handlePressEnd(e);
  });

  // 3. 키보드 스페이스바 이벤트 바인딩
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

  console.log('✅ [Timer] 타이머 이벤트 리스너 바인딩 완료');
}
