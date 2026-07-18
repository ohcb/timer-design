// timer.js
let startTime = 0;
let timerInterval = null;
let isRunning = false;
let isReady = false;

export function initTimer() {
  const timerDisplay = document.getElementById('timer-display'); // HTML의 시간 표시 엘리먼트
  if (!timerDisplay) return;

  // 1. 키보드 스페이스바 이벤트 처리 (PC/패드 키보드용)
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault(); // 스크롤 방지

    if (isRunning) {
      // 실행 중일 때 누르면 멈춤
      stopTimer();
    } else if (!isReady) {
      // 멈춰있을 때 누르고 있으면 시작 준비 (빨간색 불)
      isReady = true;
      timerDisplay.style.color = '#ff453a'; 
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault();

    if (isReady && !isRunning) {
      // 스페이스바를 떼는 순간 타이머 시작 (흰색 불)
      isReady = false;
      startTimer(timerDisplay);
    }
  });

  // 2. 화면 터치/클릭 이벤트 처리 (모바일/태블릿 터치용)
  timerDisplay.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (isRunning) {
      stopTimer();
    } else {
      isReady = true;
      timerDisplay.style.color = '#ff453a';
    }
  });

  timerDisplay.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (isReady && !isRunning) {
      isReady = false;
      startTimer(timerDisplay);
    }
  });
}

function startTimer(display) {
  isRunning = true;
  startTime = Date.now();
  display.style.color = '#ffffff';

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    display.textContent = (elapsed / 1000).toFixed(2); // 0.00 초 단위 표시
  }, 10);
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  
  const finalTime = display.textContent; // 측정된 최종 시간
  saveSolve(finalTime); // 💡 여기서 기록을 배열이나 로컬스토리지에 저장!
}

function saveSolve(time) {
  // 여기에 기록 리스트로 데이터를 보내주는 로직을 연결할 예정입니다.
  console.log(`기록 저장됨: ${time}s`);
}
