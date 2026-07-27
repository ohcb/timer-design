// solves.js

import { getSolves } from './storage.js';
import { formatTime } from './timer.js';

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

      return `
        <div class="record-card ${isPB ? 'pb-card' : ''}" data-id="${solve.id}">
          <div class="card-left">
            <div class="time-row">
              <span class="record-time">${displayTime}</span>
              ${isPB ? '<span class="badge pb-badge">PB</span>' : ''}
            </div>
            <span class="badge tag-badge">3x3</span>
          </div>
          <div class="card-right">
            <span class="card-date">${formattedDate}</span>
          </div>
        </div>
      `;
    })
    .join('');
}

export function initSolves() {
  renderSolvesList();

  // 하단 네비게이션 버튼 및 탭 버튼 클릭 감지
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-target], [data-tab], .nav-item, .tab-btn');
    if (btn) {
      renderSolvesList();
    }
  });
}
