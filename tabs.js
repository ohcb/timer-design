// tabs.js

export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  function syncNavWithActiveScreen(targetScreenId) {
    const currentTabName = targetScreenId.replace('screen-', '').toLowerCase();

    tabs.forEach(tab => {
      const tabData = (tab.getAttribute('data-tab') || tab.textContent.trim()).toLowerCase();
      if (tabData === currentTabName || (tabData === 'more' && ['profile', 'tools', 'settings', 'data'].includes(currentTabName))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    toggleHeaderCenter(targetScreenId);
  }

  // 💡 인라인 style.display를 절대 건드리지 않음 — CSS 클래스만으로 표시/숨김을 제어.
  //    (인라인 !important는 스타일시트의 어떤 !important보다 우선하기 때문에
  //     데스크톱 grid 레이아웃 같은 미디어쿼리 오버라이드를 전부 무력화시켰음)
  function activateScreen(targetScreenId) {
    screens.forEach(screen => {
      // 초기 HTML에 박혀있던 낡은 'active' 클래스는 혼선을 막기 위해 항상 정리
      screen.classList.remove('active');

      if (screen.id === targetScreenId) {
        screen.classList.add('active-screen');
      } else {
        screen.classList.remove('active-screen');
      }
    });

    syncNavWithActiveScreen(targetScreenId);

    document.dispatchEvent(new CustomEvent('cub3:tab-activated', {
      detail: { screenId: targetScreenId }
    }));
  }

  let activeFound = false;
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen') || screen.classList.contains('active')) {
      activateScreen(screen.id);
      activeFound = true;
    }
  });

  if (!activeFound) {
    activateScreen('screen-timer');
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = tab.getAttribute('data-tab');
      if (tabName) {
        activateScreen(`screen-${tabName.toLowerCase()}`);
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('#quick-settings-btn')) {
      activateScreen('screen-settings');
    }
  });

  document.querySelectorAll('.clickable-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetSubscreen = card.getAttribute('data-subscreen');
      if (targetSubscreen) {
        activateScreen(targetSubscreen);
      }
    });
  });

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateScreen('screen-more');
    });
  });
}
