// app.js

import { initTabs } from './tabs.js';
import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
import { initStats } from './stats.js'; // 💡 Stats 모듈 import 추가

// 앱이 실행될 때 호출되는 초기화 구역
document.addEventListener('DOMContentLoaded', () => {
  
  // 기존 내비게이션 탭 초기화
  initTabs();
  
  // 바텀 시트 인터랙션 초기화
  initSolvesManager();
  
  // 타이머 기능 초기화
  initTimer();

  // 💡 새로 추가한 스탯 기능 초기화
  initStats();
});
