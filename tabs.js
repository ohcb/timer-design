// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // 1. 상단바 노출 여부를 체크하는 미니 함수
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  // 🎯 [핵심] 현재 활성화된 화면(active-screen)을 보고 내비바 불빛을 알아서 켜주는 함수
  function syncNavWithActiveScreen() {
    // 현재 켜져 있는 화면을 찾습니다.
    const activeScreen = document.querySelector('.tab-screen.active-screen');
    if (!activeScreen) return;

    // 예: 'screen-timer' -> 'timer' 추출
    const currentTabName = activeScreen.id.replace('screen-', '');

    // 내비바 버튼들을 돌면서 글씨가 일치하는 녀석만 불 켜기
    tabs.forEach(tab => {
      if (tab.textContent.trim().toLowerCase() === currentTabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 상단바 노출 여부도 화면 ID에 맞춰 자동으로 연동
    toggleHeaderCenter(activeScreen.id);
  }

  // 2. 초기 상태 로드 (첫 진입 시 활성화된 화면에 맞춰 내비바 자동 싱크)
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
    } else {
      screen.style.display = 'none';
    }
  });
  syncNavWithActiveScreen(); // 👈 여기서 첫 화면 내비바 불빛을 알아서 켭니다.


  // 3. 하단 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 화면들만 먼저 싹 정리하고 타겟 화면에 active-screen 붙이기
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      // 👈 "화면이 바뀌었으니 내비바 너는 알아서 불 켜라" 호출
      syncNavWithActiveScreen(); 
    });
  });


  // 4. 홈 화면 내의 특수 버튼들 클릭 제어
  document.addEventListener('click', (event) => {
    let targetScreenId = '';

    if (event.target.closest('.start-timer-btn')) {
      targetScreenId = 'screen-timer';
    } else if (event.target.closest('.profile-pic')) {
      targetScreenId = 'screen-profile';
    }

    // 버튼이 눌리면 오직 "화면만 교체"합니다. 내비바 코드는 건드리지도 않습니다.
    if (targetScreenId) {
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      // 👈 "화면 열렸으니 내비바 너도 알아서 표시해라" 호출
      syncNavWithActiveScreen(); 
    }
  });
}
