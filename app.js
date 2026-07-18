// app.js

// 1. 상단에 import 추가
import { initTabs } from './tabs.js';
import { initSolvesManager } from './solve-bottom-sheet.js'; // 💡 새로 만든 파일 연결
import { initTimer } from './timer.js';

// 앱이 실행될 때 호출되는 초기화 구역
document.addEventListener('DOMContentLoaded', () => {
  
  // 기존에 있던 내비게이션 탭 초기화
  initTabs();
  
  // 💡 새로 추가한 바텀 시트 인터랙션 초기화
  initSolvesManager();
  
  initTimer(); // 💡 타이머 기능 작동 시작!
});

