// timer.js

export function formatTime(ms) {
  if (ms == null || Number.isNaN(ms)) return '0.00';
  const total = ms / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0
    ? `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}

export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display');
  // 화면 중앙의 타이머 구역 (.timer-zone)
  const timerZone = document.querySelector('.timer-zone') || timerDisplay;
  
  if (!timerDisplay) {
    console.error("타이머 디스플레이(.timer-display) 태그를 찾을 수 없습니다.");
    return;
  }

  let mode = 'idle'; // 'idle' | 'holding' | 'ready' | 'running'
  let startAt = 0;
  let rafId = 0;
  let holdTimer = null;
  const READY_DELAY_MS = 300; // 0.3초 홀드

  function setMode(nextMode) {
    mode = nextMode;

    if (nextMode === 'holding') {
      timerDisplay.style.color = '#ef4444'; // 빨간색
    } else if (nextMode === 'ready') {
      timerDisplay.style.color = '#22c55e'; // 초록색
    } else if (nextMode === 'running') {
      timerDisplay.style.color = '#ffffff'; // 흰색
    } else {
      timerDisplay.style.color = ''; // 기본색
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

    console.log('⏱️ 측정 시간:', timeMs, 'ms');
  }

  // --- 1. PC 스페이스바 (화면 전체 어디서나 사용 가능) ---
  window.addEventListener('keydown', (e) => {
    // input이나 textarea에 타이핑 중일 때만 스페이스바 타이머 작동 방지
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

  // --- 2. 터치 및 마우스 클릭 (.timer-zone 구역 전용) ---
  timerZone.style.cursor = 'pointer';

  // 터치 기반 (아이패드/모바일)
  timerZone.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 스크롤 등 기본 동작 방지
    handlePressStart();
  }, { passive: false });

  timerZone.addEventListener('touchend', (e) => {
    e.preventDefault();
    handlePressEnd();
  });

  // 마우스 기반 (PC 마우스 클릭 테스트용)
  timerZone.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // 좌클릭만
    handlePressStart();
  });

  timerZone.addEventListener('mouseup', (e) => {
    handlePressEnd();
  });
}
