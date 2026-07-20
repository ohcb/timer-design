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

  // 💡 [버그 1 완벽 해결] 초기 상태 로드 시, 켜져 있는 화면에 맞춰 내비바 버튼도 강제 하이라이트!
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      toggleHeaderCenter(screen.id);

      // 현재 켜진 화면 ID (예: screen-timer)에서 'screen-'을 떼고 'timer' 추출
      const currentTabName = screen.id.replace('screen-', '');
      
      // 내비바 버튼 중 글씨가 일치하는 녀석에게 active 강제 부여하여 첫 진입 싱크 맞춤
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

  // 💡 [버그 2 완벽 해결] 홈 화면 내 버튼 클릭 시 순서(인덱스) 기반 직통 제어
  // HTML 내의 글씨 오타나 이미지 태그 유무에 상관없이 무조건 지정된 순서의 탭을 정교하게 제어합니다.
  document.addEventListener('click', (event) => {
    let targetIndex = -1;
    let targetTabName = '';

    // 1. 스타트 버튼(.start-timer-btn) 클릭 시 -> 2번째 탭 (인덱스 1, timer)
    if (event.target.closest('.start-timer-btn')) {
      targetIndex = 1;
      targetTabName = 'timer';
    }
    // 2. 프로필 사진(.profile-pic) 클릭 시 -> 5번째 탭 (인덱스 4, profile)
    else if (event.target.closest('.profile-pic'))
