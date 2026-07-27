// solves.js (완벽 수정본)

import { getSolves } from './storage.js';
import { formatTime } from './timer.js';
import { openSolveBottomSheet } from './solve-bottom-sheet.js';

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export function renderSolvesList() {
  const container = document.getElementById('record-cards-container');
  if (!container) return;

  const solves = getSolves();

  if (solves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px 0;">
        저장된 기록이 없습니다.
      </div>`;
    return;
  }

  container.innerHTML = solves
    .map((solve) => {
      const displayTime = formatTime(solve.time, solve.penalty);
      const isPB = false;
      const formattedDate = formatDate(solve.createdAt || Date.now());
      const starIcon = solve.isBookmarked ? '⭐' : '☆';

      // 💡 pointer-events: none 으로 내부 자식 요소가 클릭 이벤트를 방해하지 않도록 처리
      return `
        <div class="record-card ${isPB ? 'pb-card' : ''}" data-id="${solve.id}">
          <div class="card-left" style="pointer-events: none;">
            <div class="time-row" style="pointer-events: none;">
              <span class="record-time">${displayTime}</span>
              ${isPB ? '<span class="badge pb-badge">PB</span>' : ''}
            </div>
            <span class="badge tag-badge">${solve.note ? '📝 메모' : '3x3'}</span>
          </div>
          <div class="card-right" style="pointer-events: none;">
            <span class="card-date">${formattedDate}</span>
            <span class="bookmark-icon">${starIcon}</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// solves.js 하단 부분

export function initSolves() {
  renderSolvesList();

  // Solves 카드 클릭 이벤트만 단독 처리
  document.addEventListener('click', (e) => {
    // 탭 버튼 클릭인 경우 handles.js(tabs.js)에 양보하고 통과
    if (e.target.closest('[data-tab], [data-target], .nav-item, .tab-btn')) {
      return;
    }

    // 카드 클릭 처리
    const card = e.target.closest('.record-card');
    if (card) {
      const solveId = card.getAttribute('data-id');
      if (solveId) {
        openSolveBottomSheet(solveId);
      }
    }
  });
}

