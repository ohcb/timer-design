// app.js

import { initTabs } from './tabs.js';
// import { initSessionManager } from './session-manager.js';
// import { initTimer } from './timer.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 탭 전환 켜기
  try { initTabs(); } catch(e) { console.error(e); }

  // 2. 세션 매니저 켜기
  try { initSessionManager(); } catch(e) { console.error(e); }

  // 3. 타이머 켜기
  try { initTimer(); } catch(e) { console.error(e); }
});
