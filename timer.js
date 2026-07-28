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

// 2. 타이머 화면 하단 최근 기록 렌더링
export function renderRecentSolves() {
  const container = document.getElementById('recent-solves') || document.querySelector('.recent-solves-list');
  if (!container) return;

  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = '<span style="color:#64748b; font-size:14px;">기록 없음</span>';
    return;
  }

  // 최신 5개 기록
  const recent = solves.slice(0, 5);
  container.innerHTML = recent
    .map(s => `<span style="margin: 0 6px; font-weight: 600;">${formatTime(s.time, s.penalty)}</span>`)
    .join('');
}

// 3. 타이머 화면 통계 (ao5, ao12 등) 렌더링
export function renderStats() {
  const statsEl = document.getElementById('stats-container');
  if (!statsEl) return;
  // 필요시 통계 계산 로직 연결
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

    // 💡 2. 즉시 UI 화면 갱신 (새로고침 없이 반영)
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  // --- 입력 이벤트 처리 ---

  function handlePressStart(e) {
    // 버튼, 탭, 입력창, 바텀시트 터치 시 타이머 작동 방지
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) {
      return;
    }

    if (isRunning) {
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444'; // 준비 중 빨간색
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e'; // 0.3초 누른 후 준비 완료 초록색
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

  // 터치 및 마우스, 스페이스바 이벤트 설정
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

// 2. 타이머 화면 하단 최근 기록 렌더링
export function renderRecentSolves() {
  const container = document.getElementById('recent-solves') || document.querySelector('.recent-solves-list');
  if (!container) return;

  const session = getCurrentSession();
  const solves = session ? (session.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = '<span style="color:#64748b; font-size:14px;">기록 없음</span>';
    return;
  }

  // 최신 5개 기록
  const recent = solves.slice(0, 5);
  container.innerHTML = recent
    .map(s => `<span style="margin: 0 6px; font-weight: 600;">${formatTime(s.time, s.penalty)}</span>`)
    .join('');
}

// 3. 타이머 화면 통계 (ao5, ao12 등) 렌더링
export function renderStats() {
  const statsEl = document.getElementById('stats-container');
  if (!statsEl) return;
  // 필요시 통계 계산 로직 연결
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

    // 💡 2. 즉시 UI 화면 갱신 (새로고침 없이 반영)
    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }
  }

  // --- 입력 이벤트 처리 ---

  function handlePressStart(e) {
    // 버튼, 탭, 입력창, 바텀시트 터치 시 타이머 작동 방지
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) {
      return;
    }

    if (isRunning) {
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444'; // 준비 중 빨간색
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e'; // 0.3초 누른 후 준비 완료 초록색
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

  // 터치 및 마우스, 스페이스바 이벤트 설정
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
