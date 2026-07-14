// timer.js
export function initTimer() {
  let timerInterval = null;
  let startTime = 0;
  let elapsedTime = 0;
  let isRunning = false;

  // HTML의 <div class="timer-display">0.00</div>를 정확히 가져옵니다.
  const timerDisplay = document.querySelector('.timer-display');

  // 만약 태그를 못 찾으면 자바스크립트가 멈추지 않도록 방어 코드 추가
  if (!timerDisplay) {
    console.error("타이머 디스플레이(.timer-display) 태-그를 찾을 수 없습니다.");
    return;
  }

  function formatTime(time) {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    const msString = milliseconds < 10 ? '0' + milliseconds : milliseconds;
    return `${seconds}.${msString}`;
  }

  function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timerDisplay.textContent = formatTime(elapsedTime);
    }, 10);
    isRunning = true;
  }

  function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
  }

  function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = "0.00";
    isRunning = false;
  }

  function handleTrigger() {
    if (isRunning) {
      stopTimer();
    } else {
      if (elapsedTime > 0) {
        resetTimer();
      }
      startTimer();
    }
  }

  // PC 스페이스바
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      handleTrigger();
    }
  });

  // 아이패드 터치 (타이머 숫자를 누르면 작동)
  timerDisplay.style.cursor = 'pointer'; // 누를 수 있다는 표시
  timerDisplay.addEventListener('click', () => {
    handleTrigger();
  });
}
