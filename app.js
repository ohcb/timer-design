// app.js

import { initTabs } from './tabs.js';
import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
import { initStats } from './stats.js';
import { initSessionManager } from './session-manager.js';
import { initSolves } from './solves.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 💡 세션 매니저를 가장 먼저 초기화해야 다른 기능들이 세션 데이터를 참조할 수 있습니다!
  initSessionManager();

  // 2. 나머지 UI 및 매니저 초기화
  initTabs();
  initSolvesManager();
  initStats();
  initSolves();

  // 3. 마지막에 타이머 초기화 (이제 안전하게 세션을 불러옵니다)
  initTimer();
});
