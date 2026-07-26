// timer.js
import { generateScramble } from './scramble.js'; // 스크램블 모듈 (추후 생성)

// --- 상태 변수 ---
let mode = 'idle'; // 'idle' | 'holding' | 'ready' | 'running'
let startAt = 0;
let rafId = 0;
let holdTimer = null;
const READY_DELAY_MS = 700; // 0.7초 홀드

// --- 시간 포맷 함수 ---
export function formatTime(ms) {
  if (ms == null || Number.isNaN(ms)) return '0.00';
  const total = ms / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}

// --- 타이머 화면 UI 요소 ---
function getTimerElements() {
  return {
    display: document.getElementById('timer-display') || document.querySelector('.timer-time'),
    scramble: document.getElementById('scramble-text'),
    screen: document.getElementById('screen-timer') || document.body
  };
}

// --- 상태 변경 및 UI 피드백 ---
function setMode(nextMode) {
  mode = nextMode;
  const { display, screen } = getTimerElements();

  // 기존 상태 클래스 제거 후 새 클래스 추가 (CSS 스타일링용)
  screen?.classList.remove('state-idle', 'state-holding', 'state-ready', 'state-running');
  screen?.classList.add(`state-${nextMode}`);

  if (nextMode === 'holding') {
    if (display) display.style.color = '#ef4444'; // 누르는 중: 빨간색
  } else if (nextMode === 'ready') {
    if (display) display.style.color = '#22c55e'; // 준비 완료: 초록색
  } else if (nextMode === 'running') {
    if (display) display.style.color = '#ffffff'; // 측정 중: 흰색
  } else {
    if (display) display.style.color = ''; // 기본 상태
  }
}

// 1. 홀드 시작 (Press Down)
function handlePressStart() {
  if (mode === 'running') {
    stopTimer();
    return;
  }
  if (mode !== 'idle') return;

  setMode('holding');

  // 0.7초 동안 계속 누르고 있으면 Ready 상태로 전환
  clearTimeout(holdTimer);
  holdTimer = setTimeout(() => {
    setMode('ready');
  }, READY_DELAY_MS);
}

// 2. 손 뗌 (Release)
function handlePressEnd() {
  if (mode === 'ready') {
    startTimer();
  } else if (mode === 'holding') {
    // 0.7초 채우기 전에 떼어버린 경우 취소
    clearTimeout(holdTimer);
    setMode('idle');
  }
}

// 3. 타이머 시작
function startTimer() {
  startAt = performance.now();
  setMode('running');
  tick();
}

// 4. 실시간 시간 업데이트 (60fps)
function tick() {
  const { display } = getTimerElements();
  const elapsed = Math.round(performance.now() - startAt);

  if (display) {
    display.textContent = formatTime(elapsed);
  }

  if (mode === 'running') {
    rafId = requestAnimationFrame(tick);
  }
}

// 5. 타이머 정지 및 기록 처리
function stopTimer() {
  cancelAnimationFrame(rafId);
  const timeMs = Math.round(performance.now() - startAt);
  setMode('idle');

  const { display } = getTimerElements();
  if (display) display.textContent = formatTime(timeMs);

  console.log('⏱️ 측정 완료 시간:', timeMs, 'ms');
  // 💡 TODO: 여기서 Session/LocalStorage에 기록 저장 및 스크램블 갱신 함수 호출
}

// --- 이벤트 바인딩 예외 처리 (버튼 등 누를 때 타이머 동작 방지) ---
function shouldIgnore(e) {
  return Boolean(e.target.closest('button, a, input, select, textarea, .bottom-sheet, .modal'));
}

// --- 타이머 초기화 ---
export function initTimer() {
  // 키보드 이벤트 (Spacebar)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat && !shouldIgnore(e)) {
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
    if (e.code === 'Space' && !shouldIgnore(e)) {
      e.preventDefault();
      handlePressEnd();
    }
  });

  // 터치 / 마우스 이벤트 (모바일 & PC 클릭 대응)
  const timerZone = document.getElementById('screen-timer') || document.body;

  timerZone.addEventListener('touchstart', (e) => {
    if (shouldIgnore(e)) return;
    handlePressStart();
  }, { passive: true });

  timerZone.addEventListener('touchend', (e) => {
    if (shouldIgnore(e)) return;
    handlePressEnd();
  });

  timerZone.addEventListener('mousedown', (e) => {
    if (shouldIgnore(e) || e.button !== 0) return; // 좌클릭만 허용
    handlePressStart();
  });

  timerZone.addEventListener('mouseup', (e) => {
    if (shouldIgnore(e)) return;
    handlePressEnd();
  });
}
