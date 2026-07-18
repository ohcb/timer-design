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

  // 초기 상태 로드
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      toggleHeaderCenter(screen.id);
    } else {
      screen.style.display = 'none';
    }
  });

  // 하단 탭 클릭 제어 (기본 내비게이션 기능)
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

  // 💡 홈 화면 내의 버튼들 클릭 처리 (이벤트 위임 + 인덱스 방식)
  document.addEventListener('click', (event) => {
    
    // 1. 스타트 버튼(.start-timer-btn) 누르면 -> 2번째 탭(Timer) 강제 클릭
    if (event.target.closest('.start-timer-btn')) {
      if (tabs[1]) {
        tabs[1].click();
      }
    }
    
    // 2. 프로필 사진(.profile-pic) 누르면 -> 5번째 탭(Profile) 강제 클릭
    else if (event.target.closest('.profile-pic')) {
      if (tabs[4]) {
        tabs[4].click(); // 5번째 탭 클릭
      } else {
        tabs[tabs.length - 1].click(); // 탭이 5개가 안 될 경우 맨 마지막 탭 클릭
      }
    }
  });
}
