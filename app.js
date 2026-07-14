// app.js
import { initTabs } from './tabs.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("App initialized");
  
  // 1. 탭 전환 기능 초기화
  initTabs();

  // 2. [강제 구동 보장] 앱이 켜졌을 때 Timer 화면이 무조건 보이도록 확실하게 마감 처리
  const defaultScreen = document.getElementById('screen-timer');
  const defaultTab = document.querySelector('.nav-tab:nth-child(2)'); // 두 번째가 Timer 탭

  if (defaultScreen) {
    // 모바일/PC 스타일이 충돌나지 않도록 처리
    if (window.innerWidth >= 768) {
      defaultScreen.style.setProperty('display', 'grid', 'important');
    } else {
      defaultScreen.style.setProperty('display', 'block', 'important');
    }
    defaultScreen.classList.add('active-screen');
  }

  if (defaultTab) {
    defaultTab.classList.add('active');
  }

  // 3. 기존 타이머 구동 로직이 있다면 이 아래에 배치됩니다.
  // (예: 변수 선언 및 터치 이벤트 등)
  const timerDisplay = document.querySelector('.timer-display');
  if (timerDisplay) {
    timerDisplay.addEventListener('click', () => {
      console.log("타이머 터치 감지!");
      // 타이머 구동 코드가 여기에 연결됩니다.
    });
  }
});
