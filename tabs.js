// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');
  
  // 💡 홈 화면의 'Start Timer' 버튼
  const startTimerBtn = document.querySelector('.start-timer-btn');

  if (tabs.length === 0 || screens.length === 0) return;

  // 상단바 노출 여부를 체크하는 미니 함수
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    if (screenId === 'screen-timer') {
      headerCenter.style.display = 'flex';
    } else {
      headerCenter.style.display = 'none';
    }
  }

  // 초기 상태 로드
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      toggleHeaderCenter(screen.id);
    } else {
      screen.style.display = 'none';
    }
  });

  // 하단 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      toggleHeaderCenter(targetScreenId);

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

  // 💡 너가 말한 핵심 아이디어: "스타트 타이머 버튼 누르면 그냥 내비 바 타이머 클릭해라"
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      // 내비게이션 탭 중에서 글자가 'Timer'인 버튼을 찾아서 진짜로 '클릭' 이벤트를 날림
      const timerTab = Array.from(tabs).find(t => t.textContent.trim().toLowerCase() === 'timer');
      if (timerTab) {
        timerTab.click(); // 자바스크립트가 손가락 대신 눌러줍니다.
      }
    });
  }
}
