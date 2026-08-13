// tabs.js

export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // 1. Timer 화면일 때만 상단 세션/종목 선택 영역 노출
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  // 2. 하단 내비게이션 active 클래스 동기화
  function syncNavWithActiveScreen(targetScreenId) {
    const currentTabName = targetScreenId.replace('screen-', '').toLowerCase();

    tabs.forEach(tab => {
      const tabData = (tab.getAttribute('data-tab') || tab.textContent.trim()).toLowerCase();
      // 서브 화면(profile, tools, settings, data)에 있을 때도 More 탭을 활성화 상태로 유지
      if (tabData === currentTabName || (tabData === 'more' && ['profile', 'tools', 'settings', 'data'].includes(currentTabName))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    toggleHeaderCenter(targetScreenId);
  }

  // 3. 화면 전환 (스크린 숨김/노출)
  function activateScreen(targetScreenId) {
    screens.forEach(screen => {
      if (screen.id === targetScreenId) {
        screen.style.setProperty('display', 'block', 'important');
        screen.classList.add('active-screen');
      } else {
        screen.style.setProperty('display', 'none', 'important');
        screen.classList.remove('active-screen');
      }
    });

    syncNavWithActiveScreen(targetScreenId);

    // 💡 이 화면이 방금 켜졌다는 걸 전역에 알림 — 각 탭 모듈이 구독해서
    //    새로고침 없이 항상 최신 데이터로 다시 그리도록 함
    document.dispatchEvent(new CustomEvent('cub3:tab-activated', {
      detail: { screenId: targetScreenId }
    }));
  }

  // 4. 초기 화면 설정 (기본값: screen-timer)
  let activeFound = false;
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      activateScreen(screen.id);
      activeFound = true;
    }
  });

  // active-screen 클래스가 지정된 게 없다면 기본으로 타이머 화면 켜기
  if (!activeFound) {
    activateScreen('screen-timer');
  }

  // 5. 하단 탭 클릭 이벤트 연결
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();
      const tabName = tab.getAttribute('data-tab');
      if (tabName) {
        activateScreen(`screen-${tabName.toLowerCase()}`);
      }
    });
  });

  // 6. 퀵 설정 버튼 등 외부 클릭 이벤트 연결
  document.addEventListener('click', (event) => {
    if (event.target.closest('#quick-settings-btn')) {
      activateScreen('screen-more');
    }
  });

  // 7. 서브 페이지 이동 클릭 이벤트 (함수 내부로 이동!)
  document.querySelectorAll('.clickable-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetSubscreen = card.getAttribute('data-subscreen');
      if (targetSubscreen) {
        activateScreen(targetSubscreen);
      }
    });
  });

  // 8. 서브 페이지 상단 'Back' 버튼 클릭 시 More 화면으로 복귀 (함수 내부로 이동!)
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activateScreen('screen-more');
    });
  });
} // 👈 initTabs() 함수가 여기서 닫혀야 정상입니다!
