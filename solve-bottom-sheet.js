// solve-bottom-sheet.js
export function initSolvesManager() {
  const container = document.getElementById('record-cards-container');
  const sheet = document.getElementById('detail-bottom-sheet');

  if (!container || !sheet) return;

  // 카드 클릭 시 바텀 시트 열기
  container.addEventListener('click', (event) => {
    const card = event.target.closest('.record-card');
    if (!card) return;
    sheet.classList.add('open');
  });

  // 배경 바깥 영역 클릭 시 바텀 시트 닫기
  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) {
      sheet.classList.remove('open');
    }
  });
}
