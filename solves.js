// solves.js

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

  const solves = getSolves(); // 원본 기록 목록

  if (!solves || solves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px 0;">
        저장된 기록이 없습니다.
      </div>`;
    return;
  }

  // 💡 최신순(createdAt / id 기준 내림차순) 정렬
  const sortedSolves = solves.slice().sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));

  container.innerHTML = sortedSolves
    .map((solve) => {
      const displayTime = formatTime(solve.time, solve.penalty);
      const formattedDate = formatDate(solve.createdAt || solve.id);
      const starIcon = solve.isBookmarked ? '⭐' : '🤍';

      return `
        <div class="record-card" data-id="${solve.id}">
          <div class="card-left" style="pointer-events: none;">
            <div class="time-row" style="pointer-events: none;">
              <span class="record-time">${displayTime}</span>
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

  // Solves 카드 클릭 시 바텀시트 열기
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
