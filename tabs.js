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

      // 원인 분석용 디버깅 코드
  if (startTimerBtn) {
    console.log("Start Timer 버튼 찾음!", startTimerBtn);
    
    startTimerBtn.addEventListener('click', () => {
      console.log("버튼 클릭됨! 현재 tabs 상태:", tabs);
      if (tabs[1]) {
        console.log("2번째 탭 클릭 시도:", tabs[1]);
        tabs[1].click(); 
      } else {
        console.log("tabs[1]을 찾을 수 없습니다.");
      }
    });
  } else {
    console.log("Start Timer 버튼을 찾지 못했습니다. HTML 클래스명을 확인해 주세요.");
  }

