// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  // 💡 상단바의 세션/종목 셀렉터 구역을 가져옵니다.
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // 💡 상단바 노출 여부를 체크하는 미니 함수
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return; // 혹시 태그를 못 찾았을 때를 대비한 안전장치
    
    if (screenId === 'screen-timer') {
      headerCenter.style.display = 'flex'; // 타이머 화면일 때만 보여주기
    } else {
      headerCenter.style.display = 'none'; // 그 외 모든 화면에선 숨기기
    }
  }

  // 초기 상태 로드 (active-screen만 보이고 나머지는 숨김)
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      // 💡 첫 화면 상태에 맞춰 상단바 노출 여부 결정
      toggleHeaderCenter(screen.id);
    } else {
      screen.style.display = 'none';
    }
  });

  // 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      // 활성화 버튼 불 켜기
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 💡 클릭해서 화면이 바뀔 때마다 상단바 노출 여부 감시
      toggleHeaderCenter(targetScreenId);

      // 화면 보이기/숨기기
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
}
