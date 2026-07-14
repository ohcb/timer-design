// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');

  if (tabs.length === 0 || screens.length === 0) {
    console.error("탭 버튼이나 화면 구역을 찾을 수 없습니다.");
    return;
  }

  // 💡 [핵심] 새로고침했을 때 active-screen 클래스가 있는 탭만 명확히 보여주고 시작하기
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.setProperty('display', 'grid', 'important');
    } else {
      screen.style.setProperty('display', 'none', 'important');
    }
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      // 1. 모든 탭에서 active 클래스 제거 후 클릭한 탭만 추가
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. 클릭한 탭의 글자 추출 (Timer -> screen-timer)
      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 3. 일치하는 화면만 보여주기 (CSS의 !important를 이기기 위해 js에서 직접 제어)
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          // PC 레이아웃의 grid 속성이 깨지지 않도록 처리
          if (window.innerWidth >= 768 && targetScreenId === 'screen-timer') {
            screen.style.setProperty('display', 'grid', 'important');
          } else {
            screen.style.setProperty('display', 'block', 'important');
          }
          screen.classList.add('active-screen');
        } else {
          screen.style.setProperty('display', 'none', 'important');
          screen.classList.remove('active-screen');
        }
      });
    });
  });
}
