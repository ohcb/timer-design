// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  // 1. 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    sheet.classList.add('open');
  });

  // 2. 바텀 시트 내부 클릭 이벤트
  sheet.addEventListener('click', (event) => {
    // 🗑️ Delete 버튼을 눌렀는지 직통으로 확인
    if (event.target.id === 'menu-delete' || event.target.closest('#menu-delete')) {
      alert("⚠️ 자바스크립트가 삭제 버튼 클릭을 정상적으로 감지했습니다!");
      sheet.classList.remove('open');
    }
  });
}
