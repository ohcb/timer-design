// app.js
import { initTabs } from './tabs.js';
import { initSolveManager } from './solve-bottom-sheet.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("App initialized");
  
  // 1. 탭 시스템 켜기
  initTabs();

  // 2. 타이머 전용 버튼 동작 설정 (필요시 작동하도록 뼈대 유지)
  const timerDisplay = document.querySelector('.timer-display');
  if (timerDisplay) {
    timerDisplay.addEventListener('click', () => {
      console.log("Timer display clicked");
    });
  }
});
