// tabs.js

export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault(); // 링크 클릭 시 새로고침 방지

      // 1. 모든 탭에서 active 클래스 제거하고, 클릭한 탭에만 추가
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. 누른 탭의 텍스트(Home, Timer 등)에 맞는 화면 찾기
      const tabName = tab.textContent.trim().toLowerCase(); // 예: 'home', 'timer'
      const targetScreenId = `screen-${tabName}`;

      // 3. 모든 화면을 숨기고, 목표 화면만 보여주기
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.classList.add('active-screen');
        } else {
          screen.classList.remove('active-screen');
        }
      });
    });
  });
}
