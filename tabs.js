// tabs.js

export function initTabs() {
  document.addEventListener('click', (e) => {
    // 1. 탭 이동 버튼 감지
    const tabBtn = e.target.closest('[data-tab], [data-target], .tab-btn, .nav-item');
    if (!tabBtn) return;

    // 2. 이동할 탭 ID 추출 (data-tab 또는 data-target)
    const targetTabId = tabBtn.dataset.tab || tabBtn.dataset.target;
    if (!targetTabId) return;

    // 3. 모든 탭 화면 숨기기
    const screens = document.querySelectorAll('.tab-screen, .screen');
    screens.forEach(screen => {
      screen.classList.remove('active');
      screen.style.setProperty('display', 'none', 'important');
    });

    // 4. 대상 탭 화면 표시
    const targetScreen = document.getElementById(targetTabId) || document.querySelector(`#screen-${targetTabId}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
      targetScreen.style.setProperty('display', 'block', 'important');
    }

    // 5. 하단 네비게이션 버튼 active 클래스 교체
    const allNavBtns = document.querySelectorAll('[data-tab], [data-target], .tab-btn, .nav-item');
    allNavBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    // 💡 [핵심] 상단 탑바(세션/이벤트 제어바) 노출 제어
    // 탑바의 ID나 클래스명에 맞게 선택자를 가져옵니다.
    const topBar = document.querySelector('.top-bar, .session-event-bar, #top-bar, #session-bar');
    if (topBar) {
      // 선택된 탭이 'timer' 또는 'screen-timer' 일 때만 표시
      if (targetTabId === 'timer' || targetTabId === 'screen-timer') {
        topBar.style.setProperty('display', 'flex', 'important');
      } else {
        topBar.style.setProperty('display', 'none', 'important');
      }
    }
  });
}
