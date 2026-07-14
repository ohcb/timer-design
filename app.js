// app.js (메인 허브)

import { initTimer } from './timer.js';
import { initTabs } from './tabs.js'; // 💡 탭 기능 불러오기

// 앱 시작 시 기능들 작동시키기
initTimer();
initTabs();  // 💡 탭 기능 실행하기

