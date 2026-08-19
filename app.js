// app.js

import { initSettings } from './settings.js';
import { initTabs } from './tabs.js';
import { initSessionManager } from './session-manager.js';
import { initSessionUI } from './session.js';
import { initEventManager } from './event.js';
import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
import { initStats } from './stats.js';
import { initSolves } from './solves.js';
import { initScramble } from './scramble.js';
import { initScrambleView } from './scramble-view.js';

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
  // Settings가 가장 먼저: Ready 시간/화면모드 등을 다른 모듈이 초기화 시점부터 바로 참조함
  safeInit('Settings', initSettings);

  safeInit('SessionManager', initSessionManager);
  safeInit('EventManager', initEventManager);
  safeInit('Tabs', initTabs);
  safeInit('SessionUI', initSessionUI);

  safeInit('SolvesManager', initSolvesManager);
  safeInit('Solves', initSolves);
  safeInit('Stats', initStats);
  safeInit('Scramble', initScramble);
  safeInit('ScrambleView', initScrambleView);
  safeInit('Timer', initTimer);
});
