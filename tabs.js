// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

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

  // 💡 [안전장치 보강] 초기 상태 로드
  try {
    screens.forEach(screen => {
      if (screen && screen.classList.contains('active-screen')) {
        screen.style.display = 'block';
        toggleHeaderCenter(screen.id);

        if (screen.id) {
          const currentTabName = screen.id.replace('screen-', '');
          tabs.forEach(tab => {
            if (tab && tab.textContent.trim().toLowerCase() === currentTabName) {
              tab.classList.add('active');
            } else if (tab) {
              tab.classList.remove('active');
            }
          });
        }
      } else if (screen) {
        screen.style.display = 'none';
      }
    });
  } catch (e) {
    console.error("초기화 중 에러가 발생했으나 무시하고 탭 클릭 기능을 활성화합니다.", e);
  }

  // 💡 하단 탭 클릭 제어 (여기는 이제 무조건 실행됩니다)
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      toggleHeaderCenter(targetScreenId);

      screens.forEach(screen => {
        if (screen && screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else if (screen) {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });
    });
  });

  // 💡 홈 화면 내 버튼 클릭 시 순서(인덱스) 기반 직통 제어
  document.addEventListener('click', (event) => {
    let targetIndex = -1;
    let targetTabName = '';

    if (event.target.closest('.start-timer-btn')) {
      targetIndex = 1;
      targetTabName = 'timer';
    }
    else if (event.target.closest('.profile-pic')) {
      targetIndex = 4;
      targetTabName = 'profile';
    }

    if (targetIndex !== -1 && tabs[targetIndex]) {
      const targetScreenId = `screen-${targetTabName}`;

      toggleHeaderCenter(targetScreenId);

      screens.forEach(screen => {
        if (screen && screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else if (screen) {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      tabs.forEach((tab, index) => {
        if (index === targetIndex) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }
  });
}
