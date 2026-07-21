// tabs.js
export function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const screens = document.querySelectorAll('.tab-screen');
  const headerCenter = document.querySelector('.header-center');

  if (tabs.length === 0 || screens.length === 0) return;

  // 상단바 노출 여부 체크 함수
  function toggleHeaderCenter(screenId) {
    if (!headerCenter) return;
    headerCenter.style.display = (screenId === 'screen-timer') ? 'flex' : 'none';
  }

  // 🎯 [핵심] 열려있는 메인 화면에 맞춰 내비바 불빛만 알아서 싱크 맞추는 함수
  function syncNavWithActiveScreen(targetScreenId) {
    // 'screen-timer' -> 'timer' 추출
    const currentTabName = targetScreenId.replace('screen-', '');

    // 내비바 버튼 중 글씨가 일치하는 녀석만 불 켜기
    tabs.forEach(tab => {
      if (tab.textContent.trim().toLowerCase() === currentTabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // 상단바도 연동
    toggleHeaderCenter(targetScreenId);
  }

  // 1. 초기 상태 로드 (기존에 잘 작동하던 방식 그대로 유지)
  screens.forEach(screen => {
    if (screen.classList.contains('active-screen')) {
      screen.style.display = 'block';
      syncNavWithActiveScreen(screen.id); // 첫 진입 싱크
    } else {
      // ⚠️ 타이머 내부 카드 컴포넌트가 꺼지는 걸 방지하기 위해 
      // 메인 화면 ID 패턴(screen-)을 가진 요소만 초기 상태에서 숨깁니다.
      if (screen.id && screen.id.startsWith('screen-')) {
        screen.style.display = 'none';
      }
    }
  });


  // 2. 하단 탭 클릭 제어
  tabs.forEach(tab => {
    tab.addEventListener('click', (event) => {
      event.preventDefault();

      const tabName = tab.textContent.trim().toLowerCase();
      const targetScreenId = `screen-${tabName}`;

      // 기존 방식대로 오직 메인 화면 ID를 가진 녀석들만 켜고 끕니다.
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else if (screen.id && screen.id.startsWith('screen-')) {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      // 내비바 불빛은 알아서 따라오게 설정
      syncNavWithActiveScreen(targetScreenId);
    });
  });


  // 3. 홈 화면 내의 특수 버튼들 클릭 제어 (화면 열기 누르면 내비 표시 분리형 자동화)
  document.addEventListener('click', (event) => {
    let targetScreenId = '';

    if (event.target.closest('.start-timer-btn')) {
      targetScreenId = 'screen-timer';
    } else if (event.target.closest('.profile-pic')) {
      targetScreenId = 'screen-profile';
    }

    // 버튼이 눌리면 오직 화면만 교체하고, 내비바는 동기화 함수에 위임합니다.
    if (targetScreenId) {
      screens.forEach(screen => {
        if (screen.id === targetScreenId) {
          screen.style.display = 'block';
          screen.classList.add('active-screen');
        } else if (screen.id && screen.id.startsWith('screen-')) {
          screen.style.display = 'none';
          screen.classList.remove('active-screen');
        }
      });

      // "화면 열렸으니 내비바 너도 알아서 표시해라"
      syncNavWithActiveScreen(targetScreenId);
    }
  });
}

// ⚙️ 상단 설정 버튼(⚙️) 클릭 시 Settings 화면으로 이동
const quickSettingsBtn = document.getElementById("quick-settings-btn");

if (quickSettingsBtn) {
  quickSettingsBtn.addEventListener("click", () => {
    // 1. 모든 탭 화면 숨기기
    document.querySelectorAll(".tab-screen").forEach((screen) => {
      screen.style.display = "none";
      screen.classList.remove("active");
    });

    // 2. 하단 탭 버튼 활성화 해제
    document.querySelectorAll(".main-app-navigation .nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // 3. Settings 화면 표시 및 active 클래스 추가
    const settingsScreen = document.getElementById("screen-settings");
    if (settingsScreen) {
      settingsScreen.style.display = "block";
      settingsScreen.classList.add("active");
    }
  });
}
