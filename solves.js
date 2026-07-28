// solves.js

import { getCurrentSession } from './session-manager.js'; // 💡 storage 대신 session-manager 사용
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

  // 💡 현재 활성화된 세션의 solves 목록을 가져옵니다.
  const currentSession = getCurrentSession();
  const solves = currentSession ? (currentSession.solves || []) : [];

  if (solves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px 0;">
        저장된 기록이 없습니다.
      </div>`;
    return;
  }

  container.innerHTML = solves
    .slice()
    .reverse() // 최신순 정렬
    .map((solve) => {
      const displayTime = formatTime(solve.time, solve.penalty);
      const isPB = false;
      const formattedDate = formatDate(solve.createdAt || Date.now());
      const starIcon = solve.isBookmarked ? '⭐' : '☆';

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

export function initSolves() {
  renderSolvesList();

  // Solves 카드 클릭 이벤트 처리
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-tab], [data-target], .nav-item, .tab-btn')) {
      return;
    }

    const card = e.target.closest('.record-card');
    if (card) {
      const solveId = card.getAttribute('data-id');
      if (solveId && typeof openSolveBottomSheet === 'function') {
        openSolveBottomSheet(solveId);
      }
    }
  });
}
