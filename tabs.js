// tabs.js

export function initTabs() {
  // 앱 전체에서 탭 버튼 클릭 감지
  document.addEventListener('click', (e) => {
    // 1. 클릭된 요소 또는 부모 중 탭 버튼 탐색
    const tabBtn = e.target.closest('[data-tab], [data-target], .tab-btn, .nav-item, nav a, button[class*="tab"]');
    if (!tabBtn) return;

    // 2. 이동할 탭 ID 이름 가져오기
    const rawTarget = tabBtn.dataset.tab || tabBtn.dataset.target || tabBtn.getAttribute('href')?.replace('#', '');
    if (!rawTarget) return;

    // 3. 다양한 HTML id 작성 방식 모두 지원 (timer, screen-timer, timer-screen 등)
    const possibleIds = [
      rawTarget,
      `screen-${rawTarget}`,
      `${rawTarget}-screen`,
      `tab-${rawTarget}`,
      `${rawTarget}-tab`
    ];

    // 대상 화면 요소 찾기
    let targetScreen = null;
    for (const id of possibleIds) {
      const el = document.getElementById(id);
      if (el) {
        targetScreen = el;
        break;
      }
    }

    // 대상 화면을 찾지 못한 경우 작동 중단 방지
    if (!targetScreen) return;

    // 4. 모든 탭 화면 숨기기
    const allScreens = document.querySelectorAll('.tab-screen, .screen, [id*="screen"], [id*="tab"]');
    allScreens.forEach(screen => {
      // 탭 화면 역할인 요소만 선택하여 숨김
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

    // 7. 상단 탑바(세션/이벤트바) 노출 조건 처리
    const topBar = document.querySelector('.top-bar, .session-event-bar, #top-bar, #session-bar');
    if (topBar) {
      const isTimer = rawTarget.includes('timer');
      topBar.style.display = isTimer ? 'flex' : 'none';
    }
  });
}
