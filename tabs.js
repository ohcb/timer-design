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

  // 💡 [버그 1 해결] 초기 상태 로드 시, 열려있는 화면에 맞춰 내비바 버튼도 강제 하이라이트!
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      toggleHeaderCenter(screen.id);

      // 현재 켜진 화면 ID (예: screen-timer)에서 'screen-'을 떼고 'timer' 추출
      const currentTabName = screen.id.replace('screen-', '');
      
      // 내비바 버튼 중 글씨가 일치하는 녀석에게 active 강제 부여
      tabs.forEach(tab => {
        if (tab.textContent.trim().toLowerCase() === currentTabName) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
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

      // 💡 공백이나 대소문자 때문에 매칭 실패하는 걸 방지하기 위해 정교하게 처리
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

  // 💡 [버그 2 최종 해결] 홈 화면 내의 버튼들 클릭 처리 (순서 기반 인덱스 방식)
  document.addEventListener('click', (event) => {
    
    // 1. 스타트 버튼(.start-timer-btn) 누르면 -> 2번째 탭(Timer) 강제 클릭
    // 배열 순서는 0부터 시작하므로 [1]이 두 번째 탭인 Timer가 됩니다.
    if (event.target.closest('.start-timer-btn')) {
      if (tabs[1]) {
        tabs[1].click(); 
      }
    }
    
    // 2. 프로필 사진(.profile-pic) 누르면 -> 5번째 탭(Profile) 강제 클릭
    // 배열 순서상 [4]가 다섯 번째 탭인 Profile이 됩니다.
    else if (event.target.closest('.profile-pic')) {
      if (tabs[4]) {
        tabs[4].click(); 
      } else {
        tabs[tabs.length - 1].click(); // 혹시 탭 개수가 부족하면 맨 마지막 탭 클릭
      }
    }
  });
