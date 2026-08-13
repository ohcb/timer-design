// solves.js

import { getSolves } from './storage.js';
import { formatTime } from './timer.js';
import { openSolveBottomSheet } from './solve-bottom-sheet.js';
import { getCurrentEvent, getSolveEvent, getEventName, setCurrentEvent, EVENT_LIST } from './event.js';

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

  const currentEvent = getCurrentEvent();
  const allSolves = getSolves(); // 현재 세션의 전체 기록
  // 💡 현재 선택된 종목의 기록만 필터링
  const solves = allSolves.filter(s => getSolveEvent(s) === currentEvent);

  if (!solves || solves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 40px 0;">
        ${getEventName(currentEvent)} 기록이 없습니다.
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
            <span class="badge tag-badge">${solve.note ? '📝 메모' : getEventName(getSolveEvent(solve))}</span>
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

// Solves 탭 상단의 종목 드롭다운을 전역 종목 목록/상태와 동기화
function syncSolvesEventDropdown() {
  const select = document.querySelector('#screen-solves .event-dropdown');
  if (!select) return;

  select.innerHTML = EVENT_LIST
    .map(e => `<option value="${e.id}">${e.name}</option>`)
    .join('');

  select.value = getCurrentEvent();
}

export function initSolves() {
  syncSolvesEventDropdown();
  renderSolvesList();

  // Solves 탭 자체 종목 드롭다운에서 종목을 바꿔도 전역 종목이 바뀜
  document.addEventListener('change', (e) => {
    if (e.target.matches('#screen-solves .event-dropdown')) {
      setCurrentEvent(e.target.value);
    }
  });

  // 종목이 바뀌면(헤더든 이 탭이든) 목록 즉시 갱신 + 드롭다운 값도 동기화
  document.addEventListener('cub3:event-changed', () => {
    syncSolvesEventDropdown();
    renderSolvesList();
  });

  // 세션이 바뀌면(Session 탭 전환, 헤더 드롭다운) 목록도 즉시 갱신
  document.addEventListener('cub3:session-changed', () => {
    renderSolvesList();
  });

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
