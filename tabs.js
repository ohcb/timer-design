// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');
  
  // 💡 홈 화면의 'Start Timer' 버튼 가져오기
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

  // 💡 공통 화면 전환 함수 (중복 코드를 줄이고 어디서든 화면을 바꿀 수 있게 분리)
  function switchScreen(targetTabName) {
    const targetScreenId = `screen-${targetTabName}`;

    // 1. 하단 탭 버튼 불 켜기/끄기
    tabs.forEach(t => {
      const tabText = t.textContent.trim().toLowerCase();
      if (tabText === targetTabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // 2. 상단바 세션/종목 노출 제어
    toggleHeaderCenter(targetScreenId);

    // 3. 실제 화면 보이기/숨기기
    screens.forEach(screen => {
      if (screen.id === targetScreenId) {
        screen.style.display = 'block';
        screen.classList.add('active-screen');
      } else {
        screen.style.display = 'none';
        screen.classList.remove('active-screen');
      }
    });
  }

  // 초기 상태 로드 (active-screen만 보이고 나머지는 숨김)
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
      const tabName = tab.textContent.trim().toLowerCase();
      switchScreen(tabName); // 분리한 화면 전환 함수 호출
    });
  });

  // 💡 [추가] 홈 화면의 '▶ Start Timer' 버튼 클릭 이벤트
  if (startTimerBtn) {
    startTimerBtn.addEventListener('click', () => {
      // 진짜로 타이머를 시작하러 가듯이 'timer' 탭으로 화면을 끕니다.
      switchScreen('timer');
    });
  }
}
