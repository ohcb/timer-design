// app.js

import { initTabs } from './tabs.js';
import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
import { initStats } from './stats.js';
// import { initSessionManager } from './session-manager.js';
import { initSolves } from './solves.js';

// 💡 각 초기화 함수를 안전하게 실행하는 래퍼(Wrapper) 함수
function safeInit(fnName, initFn) {
  try {
    if (typeof initFn === 'function') {
      initFn();
      console.log(`✅ [Init Success] ${fnName}`);
    }
  } catch (error) {
    // 특정 모듈에서 에러가 발생해도 다른 모듈로 에러가 전파되지 않도록 차단
    console.error(`❌ [Init Failed] ${fnName}:`, error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. 가장 먼저 세션 데이터 및 기본 UI 탭 초기화
  safeInit('SessionManager', initSessionManager);
  safeInit('Tabs', initTabs);

  // 2. 하단 시트 및 솔브 리스트 초기화
  safeInit('SolvesManager', initSolvesManager);
  safeInit('Solves', initSolves);

  // 3. 통계 및 타이머 초기화
  safeInit('Stats', initStats);
  safeInit('Timer', initTimer);
});
