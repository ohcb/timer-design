// timer.js (새로 작성된 타이머 완결본)

import { saveToStorage, loadFromStorage } from './storage.js';
import { renderSolvesList } from './solves.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;

// 1. 시간 포맷 변환 함수 (모듈 공용)
export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';
  
  let totalMs = ms;
  if (penalty === '+2') totalMs += 2000;

  const seconds = (totalMs / 1000).toFixed(2);
  return penalty === '+2' ? `${seconds}+` : seconds;
}

// 2. 외부 및 내부 연동용 UI 갱신 함수들
export function renderRecentSolves() {
  // 메인 타이머 하단에 최근 5개 기록 등을 띄우는 용도
}

export function renderStats() {
  // 메인 타이머 하단에 ao5, ao12 통계를 계산해 띄우는 용도
}

// 3. 메인 타이머 초기화 함수
export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) {
    console.error('❌ [timer.js] 타이머 표시 요소를 찾을 수 없습니다.');
    return;
  }

  // 화면 숫자 업데이트
  function updateDisplay(timeMs) {
    const sec = (timeMs / 1000).toFixed(2);
    timerDisplay.textContent = sec;
  }

  // 타이머 시작
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

  // 타이머 정지 & 기록 저장
  function stopTimer() {
    isRunning = false;
    timerDisplay.style.color = ''; // 색상 원복

    // [A] 데이터 저장
    try {
      const sessions = loadFromStorage('cub3_sessions') || [];
      const currentSessionId = loadFromStorage('cub3_current_session_id');
      
      let activeSession = sessions.find(s => String(s.id) === String(currentSessionId));
      if (!activeSession && sessions.length > 0) {
        activeSession = sessions[0];
      }

      if (activeSession) {
        activeSession.solves = activeSession.solves || [];
        
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

        // 최신 기록을 맨 앞에 저장
        activeSession.solves.unshift(newSolve);
        saveToStorage('cub3_sessions', sessions);
        console.log('✅ [기록 저장 성공]', newSolve);
      } else {
        console.warn('⚠️ 활성화된 세션이 없어 저장하지 못했습니다.');
      }
    } catch (e) {
      console.error('❌ [저장 실패]', e);
    }

    // [B] 저장 완료 후 화면 갱신
    try {
      if (typeof renderSolvesList === 'function') renderSolvesList();
      renderRecentSolves();
      renderStats();
    } catch (e) {
      console.error('❌ [UI 갱신 실패]', e);
    }
  }

  // --- 이벤트 핸들러 ---

  function handlePressStart(e) {
    // 버튼, 입력창, 세션 탭, 카드 등을 누를 때는 타이머 동작 방지
    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, .bottom-sheet')) {
      return;
    }

    // 이미 가동 중이면 즉시 멈추기
    if (isRunning) {
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444'; // 눌렀을 때 빨간색
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e'; // 0.3초 대기 완료 후 초록색
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
      timerDisplay.style.color = ''; // 대기 시간 채우기 전에 떼면 원복
    }
    isReady = false;
  }

  // Touch (모바일/아이패드)
  document.addEventListener('touchstart', handlePressStart, { passive: true });
  document.addEventListener('touchend', handlePressEnd);

  // Mouse (PC 테스트용)
  document.addEventListener('mousedown', (e) => {
    if (e.button === 0) handlePressStart(e);
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) handlePressEnd(e);
  });

  // Keyboard (스페이스바)
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

  console.log('✅ [timer.js] 타이머 초기화 완료');
}
