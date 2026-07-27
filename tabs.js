// tabs.js

export function initTabs() {
  document.addEventListener('click', (e) => {
    // 1. 클릭된 요소 또는 부모 중 탭 버튼 탐색
    const tabBtn = e.target.closest('[data-tab], [data-target], .tab-btn, .nav-item, nav a');
    if (!tabBtn) return;

    // 2. 이동할 탭 ID 가져오기
    const rawTarget = tabBtn.dataset.tab || tabBtn.dataset.target || tabBtn.getAttribute('href')?.replace('#', '');
    if (!rawTarget) return;

    // 3. 다양한 HTML id 패턴 대조 (timer, screen-timer, timer-screen 등)
    const possibleIds = [
      rawTarget,
      `screen-${rawTarget}`,
      `${rawTarget}-screen`,
      `tab-${rawTarget}`,
      `${rawTarget}-tab`
    ];

    let targetScreen = null;
    for (const id of possibleIds) {
      const el = document.getElementById(id);
      if (el) {
        targetScreen = el;
        break;
      }
    }

    if (!targetScreen) return;

    // 4. 모든 탭 화면 숨기기
    const allScreens = document.querySelectorAll('.tab-screen, .screen, [id*="screen"], [id*="tab"]');
    allScreens.forEach(screen => {
      if (screen.classList.contains('tab-screen') || screen.classList.contains('screen')) {
        screen.classList.remove('active');
        screen.style.display = 'none';
      }
    });

    // 5. 클릭한 탭 화면 활성화
    targetScreen.classList.add('active');
    targetScreen.style.display = 'block';

    // 6. 하단 네비게이션 버튼 active 클래스 교체
    const allNavBtns = document.querySelectorAll('[data-tab], [data-target], .tab-btn, .nav-item');
    allNavBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    // 7. 💡 상단 탑바(.topbar) 노출 제어
    const topBar = document.querySelector('.topbar');
    if (topBar) {
      const isTimerTab = rawTarget === 'timer' || rawTarget.includes('timer');
      
      if (isTimerTab) {
        topBar.style.setProperty('display', 'flex', 'important'); // 타이머 탭에서는 보임
      } else {
        topBar.style.setProperty('display', 'none', 'important'); // 다른 탭에서는 숨김
      }
    }
  });
}
