// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');

  if (tabs.length === 0 || screens.length === 0) return;

  // 초기 상태 로드 (active-screen만 보이고 나머지는 숨김)
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
    } else {
      screen.style.display = 'none';
    }
  });

  // 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      // 활성화 버튼 불 켜기
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 화면 보이기/숨기기
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });
    });
  });
}
