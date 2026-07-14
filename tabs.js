// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');

  if (tabs.length === 0 || screens.length === 0) {
    console.error("탭 버튼이나 화면 구역을 찾을 수 없습니다.");
    return;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      // 1. 모든 탭에서 활성화(active) 클래스 제거 후 클릭한 탭만 추가
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. 클릭한 탭의 글자 추출 (Home -> screen-home)
      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 3. 일치하는 화면만 보여주기
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
