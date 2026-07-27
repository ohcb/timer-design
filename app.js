// app.js

import { initTabs } from './tabs.js';
import { initSolvesManager } from './solve-bottom-sheet.js';
import { initTimer } from './timer.js';
import { initStats } from './stats.js';
import { initSessionManager } from './session-manager.js';
import { initSolves } from './solves.js'; // 💡 추가

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSolvesManager();
  initTimer();
  initStats();
  initSessionManager();
  initSolves(); // 💡 추가
});
