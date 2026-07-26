// tabs.js

export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // Timer 화면일 때만 상단 세션/종목 선택 영역 노출
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  // 하단 내비게이션 바 active 클래스 동기화
  function syncNavWithActiveScreen(targetScreenId) {
    const currentTabName = targetScreenId.replace('screen-', '');

    tabs.forEach(tab => {
      const tabData = tab.getAttribute('data-tab') || tab.textContent.trim().toLowerCase();
      if (tabData === currentTabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    toggleHeaderCenter(targetScreenId);
  }

  // 화면 전환 함수
  function activateScreen(targetScreenId) {
    screens.forEach(screen => {
      if (screen.id === targetScreenId) {
        screen.style.display = 'block';
        screen.classList.add('active-screen');
      } else if (screen.id && screen.id.startsWith('screen-')) {
        screen.style.display = 'none';
        screen.classList.remove('active-screen');
      }
    });

    syncNavWithActiveScreen(targetScreenId);
  }

  // 초기화 (기본: screen-timer)
  let hasActive = false;
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      syncNavWithActiveScreen(screen.id);
      hasActive = true;
    } else if (screen.id && screen.id.startsWith('screen-')) {
      screen.style.display = 'none';
    }
  });

  if (!hasActive) {
    activateScreen('screen-timer');
  }

  // 탭 클릭 이벤트
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = tab.getAttribute('data-tab');
      activateScreen(`screen-${tabName}`);
    });
  });

  // 기타 버튼 연동 (예: ⚙️ 퀵 설정 버튼 클릭 시 More 탭으로 이동)
  document.addEventListener('click', (event) => {
    if (event.target.closest('#quick-settings-btn')) {
      activateScreen('screen-more');
    }
  });
}
