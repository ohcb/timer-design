// solve-bottom-sheet.js

import { getSolves, updateSolvePenalty, deleteSolve, updateSolveNote, toggleSolveBookmark } from './storage.js';
import { formatTime, renderRecentSolves, renderStats } from './timer.js';
import { renderSolvesList } from './solves.js';

let activeSolveId = null;

// 날짜 포맷 함수 (YYYY.MM.DD HH:mm:ss)
function formatFullDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}:${ss}`;
}

export function openSolveBottomSheet(id) {
  const solves = getSolves();
  const target = solves.find(s => s.id === id);
  if (!target) return;

  activeSolveId = id;

  const sheet = document.getElementById('detail-bottom-sheet');
  if (!sheet) return;

  // 1. 시간 및 날짜 표시
  const timeEl = sheet.querySelector('.sheet-main-time');
  const dateEl = sheet.querySelector('.date-value');
  const scrambleEl = sheet.querySelector('.scramble-text');
  const noteInput = sheet.querySelector('.sheet-note-input');
  const bookmarkBtn = document.getElementById('sheet-bookmark-btn');

  if (timeEl) timeEl.textContent = formatTime(target.time, target.penalty);
  if (dateEl) dateEl.textContent = formatFullDate(target.createdAt || Date.now());
  if (scrambleEl) scrambleEl.textContent = target.scramble || "R2 U' F2 D L2 B2 D' F2 U2 R2 D' F2 ...";
  if (noteInput) noteInput.value = target.note || '';
  if (bookmarkBtn) bookmarkBtn.textContent = target.isBookmarked ? '⭐' : '🤍';

  // 2. 패널티 버튼 활성화 상태 표시
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn');
  penaltyBtns.forEach(btn => {
    const p = btn.dataset.penalty;
    const currentP = target.penalty === 'NONE' ? 'OK' : target.penalty;
    if (currentP === p || (target.penalty === undefined && p === 'OK')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 바텀시트 열기
  sheet.classList.add('active');
  sheet.style.display = 'block';
}

export function closeSolveBottomSheet() {
  const sheet = document.getElementById('detail-bottom-sheet');
  if (sheet) {
    sheet.classList.remove('active');
    sheet.style.display = 'none';
  }
  activeSolveId = null;
}

export function initSolvesManager() {
  const sheet = document.getElementById('detail-bottom-sheet');
  if (!sheet) return;

  // 1. 바깥 영역 클릭시 바텀시트 닫기
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) {
      closeSolveBottomSheet();
    }
  });

  // 2. 핸들 바 클릭시 닫기
  const handle = sheet.querySelector('.bottom-sheet-handle');
  if (handle) {
    handle.addEventListener('click', closeSolveBottomSheet);
  }

  // 3. 패널티 변경 이벤트
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn');
  penaltyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeSolveId) return;

      let penalty = btn.dataset.penalty;
      if (penalty === 'OK') penalty = 'NONE';

      updateSolvePenalty(activeSolveId, penalty);
      
      // UI 갱신
      openSolveBottomSheet(activeSolveId); // 시트 내용 업데이트
      renderSolvesList(); // Solves 리스트 갱신
      renderRecentSolves(); // Timer 탭 Recent Solves 갱신
      renderStats(); // Stats 갱신
    });
  });

  // 4. 메모(Notes) 입력 시 자동 저장
  const noteInput = sheet.querySelector('.sheet-note-input');
  if (noteInput) {
    noteInput.addEventListener('input', (e) => {
      if (!activeSolveId) return;
      updateSolveNote(activeSolveId, e.target.value);
    });
  }

  // 5. 북마크 버튼
  const bookmarkBtn = document.getElementById('sheet-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      if (!activeSolveId) return;
      const isBookmarked = toggleSolveBookmark(activeSolveId);
      bookmarkBtn.textContent = isBookmarked ? '⭐' : '🤍';
      renderSolvesList();
    });
  }

  // 6. 삭제 기능 (메뉴 또는 삭제 버튼)
  const deleteBtn = sheet.querySelector('#menu-delete, .delete-item');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeSolveId) return;
      
      deleteSolve(activeSolveId);
      closeSolveBottomSheet();
      
      renderSolvesList();
      renderRecentSolves();
      renderStats();
    });
  }

  // 7. 더보기(⋮) 메뉴 토글
  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');
  if (moreBtn && contextMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      contextMenu.style.display = contextMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });
  }

  // 8. 스크램블 복사 기능
  const copyBtn = sheet.querySelector('.scramble-copy-btn');
  const scrambleText = sheet.querySelector('.scramble-text');
  if (copyBtn && scrambleText) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(scrambleText.textContent).then(() => {
        copyBtn.textContent = '✅';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
      });
    });
  }
}
