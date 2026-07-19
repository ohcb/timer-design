// timer.js
export function initTimer() {
  let timerInterval = null;
  let startTime = 0;
  let elapsedTime = 0;
  let isRunning = false;

  // HTML에서 타이머 글자가 표시되는 구역을 가져옵니다.
  const timerDisplay = document.querySelector('.timer-display');

  // 방어 코드: 만약 태그를 못 찾으면 실행을 멈춰서 다른 스크립트(tabs.js 등)가 깨지지 않게 보호합니다.
  if (!timerDisplay) {
    console.error("타이머 디스플레이(.timer-display) 태그를 찾을 수 없습니다.");
    return;
  }

  // 밀리초 데이터를 0.00 형태로 변환하는 함수
  function formatTime(time) {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    const msString = milliseconds < 10 ? '0' + milliseconds : milliseconds;
    return `${seconds}.${msString}`;
  }

  // 타이머 시작
  function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timerDisplay.textContent = formatTime(elapsedTime);
    }, 10);
    isRunning = true;
  }

  // 타이머 멈춤
  function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
  }

  // 타이머 초기화
  function resetTimer() {
    clearInterval(timerInterval);
    elapsedTime = 0;
    timerDisplay.textContent = "0.00";
    isRunning = false;
  }

  // 시작 / 정지 / 초기화 트리거 제어
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

  // 1. PC 사용자를 위한 스페이스바 이벤트 등록
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault(); // 스페이스바 누를 때 화면이 아래로 내려가는 현상 방지
      handleTrigger();
    }
  });

  // 2. 아이패드 사용자를 위한 터치(클릭) 이벤트 등록
  timerDisplay.style.cursor = 'pointer'; // 터치 가능한 영역임을 시각적으로 표시
  timerDisplay.addEventListener('click', () => {
    handleTrigger();
  });
}
