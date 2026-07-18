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

  // 하단 탭 클릭 제어 (항상 작동해야 하는 핵심 코드)
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

     // 2. 💡 사람 얼굴 사진(.profile-pic) 누르면 -> 프로필 화면으로 이동
    else if (event.target.closest('.profile-pic')) {
      screens.forEach(screen => {
        screen.style.display = screen.id === 'screen-profile' ? 'block' : 'none';
        if (screen.id === 'screen-profile') screen.classList.add('active-screen');
        else screen.classList.remove('active-screen');
      });

      tabs.forEach(t => {
        t.classList.toggle('active', t.textContent.trim().toLowerCase() === 'profile');
      });

      toggleHeaderCenter('screen-profile');
    }
  });
}

    // 💡 [변경] 이벤트 위임 방식으로 어떤 상황에서든 클릭 잡아내기
  document.addEventListener('click', (event) => {
    // 클릭된 요소가 .start-timer-btn 이거나, 그 안의 텍스트/아이콘일 때
    if (event.target.closest('.start-timer-btn')) {
      
      // 1. 모든 화면 숨기고 screen-timer만 켜기
      screens.forEach(screen => {
        if (screen.id === 'screen-timer') {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      // 2. 내비 바 불빛도 Timer로 옮기기
      tabs.forEach(t => {
        if (t.textContent.trim().toLowerCase() === 'timer') {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      // 3. 상단바 보여주기
      toggleHeaderCenter('screen-timer');
    }
  });
}
    
  
