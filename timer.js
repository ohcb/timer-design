// timer.js

// --- 시간 포맷 함수 (밀리초 -> 0.00 또는 1:02.34) ---
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
  
  // 방어 코드: 태그를 못 찾으면 실행 중단
  if (!timerDisplay) {
    console.error("타이머 디스플레이(.timer-display) 태그를 찾을 수 없습니다.");
    return;
  }

  // 내부 상태 변수
  let mode = 'idle'; // 'idle' | 'holding' | 'ready' | 'running'
  let startAt = 0;
  let rafId = 0;
  let holdTimer = null;
  const READY_DELAY_MS = 700; // 0.7초 누르고 있어야 초록색 준비 완료

  // 모드 변경 및 시각적 효과 (색상 변경)
  function setMode(nextMode) {
    mode = nextMode;

    if (nextMode === 'holding') {
      timerDisplay.style.color = '#ef4444'; // 누르는 중: 빨간색
    } else if (nextMode === 'ready') {
      timerDisplay.style.color = '#22c55e'; // 0.7초 달성: 초록색 (Ready)
    } else if (nextMode === 'running') {
      timerDisplay.style.color = '#ffffff'; // 측정 중: 흰색
    } else {
      timerDisplay.style.color = ''; // 대기 상태: 기본 테마 색상
    }
  }

  // 1. 눌렀을 때 (Press Start)
  function handlePressStart() {
    if (mode === 'running') {
      stopTimer();
      return;
    }
    if (mode !== 'idle') return;

    setMode('holding');

    // 0.7초 홀드 카운트다운 시작
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      setMode('ready');
    }, READY_DELAY_MS);
  }

  // 2. 손을 뗐을 때 (Press End)
  function handlePressEnd() {
    if (mode === 'ready') {
      startTimer();
    } else if (mode === 'holding') {
      // 0.7초 채우기 전에 떼버리면 취소
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

  // 4. 실시간 60fps 시간 업데이트
  function tick() {
    const elapsed = Math.round(performance.now() - startAt);
    timerDisplay.textContent = formatTime(elapsed);

    if (mode === 'running') {
      rafId = requestAnimationFrame(tick);
    }
  }

  // 5. 타이머 정지 및 기록 완료
  function stopTimer() {
    cancelAnimationFrame(rafId);
    const timeMs = Math.round(performance.now() - startAt);
    setMode('idle');
    timerDisplay.textContent = formatTime(timeMs);

    console.log('⏱️ 측정된 시간:', timeMs, 'ms');
    // 💡 TODO: 세션 저장 및 스크램블 자동 재생성 함수 연결 구역
  }

  // 버튼/모달 등 스톱워치 제외 대상 감지
  function shouldIgnore(e) {
    return Boolean(e.target.closest('button, a, input, select, textarea, .bottom-sheet, .modal-overlay'));
  }

  // --- 이벤트 리스너 등록 ---

  // PC: 스페이스바 이벤트
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

  // 아이패드 & 모바일 & PC 마우스 클릭/터치 이벤트
  const touchZone = document.getElementById('screen-timer') || timerDisplay;

  touchZone.addEventListener('touchstart', (e) => {
    if (shouldIgnore(e)) return;
    handlePressStart();
  }, { passive: true });

  touchZone.addEventListener('touchend', (e) => {
    if (shouldIgnore(e)) return;
    handlePressEnd();
  });

  touchZone.addEventListener('mousedown', (e) => {
    if (shouldIgnore(e) || e.button !== 0) return;
    handlePressStart();
  });

  touchZone.addEventListener('mouseup', (e) => {
    if (shouldIgnore(e)) return;
    handlePressEnd();
  });
}
