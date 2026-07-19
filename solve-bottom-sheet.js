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

  // 배경 바깥 영역 클릭 시 바텀 시트 닫기 (조건 고도화 🛠️)
  sheet.addEventListener('click', (event) => {
    // 💡 클릭된 요소가 시트 본체(.bottom-sheet-content) 내부가 아니라면 무조건 닫기!
    if (!event.target.closest('.bottom-sheet-content')) {
      sheet.classList.remove('open');
    }
  });
}
