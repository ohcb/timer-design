// tabs.js

export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // 상단바 노출 여부 체크 함수 (Timer 화면일 때만 노출)
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  // 🎯 화면 ID에 맞춰 내비바 불빛 및 상단바 싱크 맞추는 함수
  function syncNavWithActiveScreen(targetScreenId) {
    const currentTabName = targetScreenId.replace('screen-', '');

    tabs.forEach(tab => {
      // data-tab 속성을 우선 확인하고, 없으면 textContent 참조
      const tabData = tab.getAttribute('data-tab') || tab.textContent.trim().toLowerCase();
      
      if (tabData === currentTabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    toggleHeaderCenter(targetScreenId);
  }

  // 🎯 특정 화면을 활성화하는 통합 함수
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

  // 1. 초기 상태 로드
  let hasActive = false;
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      syncNavWithActiveScreen(screen.id);
      hasActive = true;
    } else {
      if (screen.id && screen.id.startsWith('screen-')) {
        screen.style.display = 'none';
      }
    }
  });

  // 만약 active-screen 지정된 게 없으면 기본으로 screen-timer 활성화
  if (!hasActive) {
    activateScreen('screen-timer');
  }

  // 2. 하단 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = tab.getAttribute('data-tab') || tab.textContent.trim().toLowerCase();
      activateScreen(`screen-${tabName}`);
    });
  });

  // 3. 특수 버튼들 클릭 제어
  document.addEventListener('click', (event) => {
    let targetScreenId = '';

    if (event.target.closest('.start-timer-btn')) {
      targetScreenId = 'screen-timer';
    } else if (event.target.closest('.profile-pic')) {
      targetScreenId = 'screen-profile';
    } else if (event.target.closest('#quick-settings-btn')) {
      targetScreenId = 'screen-settings';
    }

    if (targetScreenId) {
      activateScreen(targetScreenId);
    }
  });
}
