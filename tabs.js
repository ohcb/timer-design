// tabs.js

export function initTabs() {
  document.addEventListener('click', (e) => {
    // 1. 클릭된 요소나 그 부모 중 탭 버튼 탐색
    const tabBtn = e.target.closest('[data-tab], [data-target], .tab-btn, .nav-item');
    if (!tabBtn) return;

    // 2. 이동할 탭 ID 가져오기 (data-tab 또는 data-target 속성 지원)
    const targetTabId = tabBtn.dataset.tab || tabBtn.dataset.target;
    if (!targetTabId) return;

    // 3. 모든 탭 화면 숨기기
    const screens = document.querySelectorAll('.tab-screen, .screen');
    screens.forEach(screen => {
      screen.classList.remove('active');
      screen.style.setProperty('display', 'none', 'important');
    });

    // 4. 클릭한 대상 탭 화면 보이기
    const targetScreen = document.getElementById(targetTabId) || document.querySelector(`#screen-${targetTabId}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.style.setProperty('display', 'block', 'important');
    }

    // 5. 하단 네비게이션 버튼 active 스타일 교체
    const allNavBtns = document.querySelectorAll('[data-tab], [data-target], .tab-btn, .nav-item');
    allNavBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
  });
}
