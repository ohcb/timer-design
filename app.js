// app.js

import { initTabs } from './tabs.js';
import { initSessionManager } from './session-manager.js';
// import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
// import { initStats } from './stats.js';
// import { initSolves } from './solves.js';

function safeInit(fnName, initFn) {
  try {
    if (typeof initFn === 'function') {
      initFn();
      console.log(`✅ [Init Success] ${fnName}`);
    }
  } catch (error) {
    console.error(`❌ [Init Failed] ${fnName}:`, error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  safeInit('SessionManager', initSessionManager);
  safeInit('Tabs', initTabs);

  // safeInit('SolvesManager', initSolvesManager);
  // safeInit('Solves', initSolves);
  // safeInit('Stats', initStats);
  safeInit('Timer', initTimer);
});
