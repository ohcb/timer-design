// solve-bottom-sheet.js

import { getSolves, saveSolves, updateSolvePenalty, deleteSolve, updateSolveNote, toggleSolveBookmark } from './storage.js';
import { formatTime, renderRecentSolves, renderStats } from './timer.js';
import { renderSolvesList } from './solves.js';

let activeSolveId = null;
let undoTimer = null;
let lastDeletedSolve = null; // Undo용 백업 저장소

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

// 💡 Undo 토스트 띄우기 함수
export function showUndoToast(deletedSolve, onUndoCallback) {
  const toast = document.getElementById('global-undo-toast');
  const undoBtn = document.getElementById('global-undo-btn');
  if (!toast) return;

  lastDeletedSolve = deletedSolve;

  // 기존 타이머 리셋
  if (undoTimer) clearTimeout(undoTimer);

  // 토스트 표시
  toast.classList.add('show');
  toast.style.setProperty('display', 'flex', 'important');
  toast.style.setProperty('opacity', '1', 'important');

  // Undo 버튼 이벤트 등록 (이벤트 중복 방지를 위한 노드 교체)
  if (undoBtn) {
    const newUndoBtn = undoBtn.cloneNode(true);
    undoBtn.parentNode.replaceChild(newUndoBtn, undoBtn);

    newUndoBtn.addEventListener('click', () => {
      if (onUndoCallback && lastDeletedSolve) {
        onUndoCallback(lastDeletedSolve);
      }
      hideUndoToast();
    }, { once: true });
  }

  // 4초 후 자동으로 토스트 숨김
  undoTimer = setTimeout(() => {
    hideUndoToast();
  }, 4000);
}

// 💡 Undo 토스트 숨기기 함수
export function hideUndoToast() {
  const toast = document.getElementById('global-undo-toast');
  if (toast) {
    toast.classList.remove('show');
    toast.style.setProperty('display', 'none', 'important');
    toast.style.setProperty('opacity', '0', 'important');
  }
  if (undoTimer) clearTimeout(undoTimer);
  lastDeletedSolve = null;
}

export function openSolveBottomSheet(id) {
  const solves = getSolves();
  const target = solves.find(s => String(s.id) === String(id));
  if (!target) return;

  activeSolveId = target.id;

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
  if (scrambleEl) scrambleEl.textContent = target.scramble || "U2 F2 U' R2 D B2 F2 D L2 U' L2 B2";
  if (noteInput) noteInput.value = target.note || '';
  if (bookmarkBtn) bookmarkBtn.textContent = target.isBookmarked ? '⭐' : '🤍';

  // 2. 패널티 버튼 활성화 상태 표시
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn, .penalty-btn');
  penaltyBtns.forEach(btn => {
    const p = btn.dataset.penalty;
    const currentP = (!target.penalty || target.penalty === 'NONE') ? 'OK' : target.penalty;
    if (currentP === p) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 시트 보이기
  sheet.classList.add('active', 'open');
  sheet.style.setProperty('display', 'flex', 'important');
}

export function closeSolveBottomSheet() {
  const sheet = document.getElementById('detail-bottom-sheet');
  if (sheet) {
    sheet.classList.remove('active', 'open');
    sheet.style.setProperty('display', 'none', 'important');
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
  const handle = sheet.querySelector('.bottom-sheet-handle, .drag-handle');
  if (handle) {
    handle.addEventListener('click', closeSolveBottomSheet);
  }

  // 3. 패널티 변경 이벤트
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn, .penalty-btn');
  penaltyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeSolveId) return;

      let penalty = btn.dataset.penalty;
      if (penalty === 'OK') penalty = 'NONE';

      updateSolvePenalty(activeSolveId, penalty);
      
      openSolveBottomSheet(activeSolveId);
      renderSolvesList();
      renderRecentSolves();
      renderStats();
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

  // 6. 삭제 기능 (삭제 후 Undo 토스트 연동 💡)
  const deleteBtn = sheet.querySelector('#menu-delete, .delete-item');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeSolveId) return;

      const solves = getSolves();
      const targetSolve = solves.find(s => String(s.id) === String(activeSolveId));
      if (!targetSolve) return;

      // 1) 기록 삭제 실행
      deleteSolve(activeSolveId);
      closeSolveBottomSheet();

      // 2) UI 갱신
      renderSolvesList();
      renderRecentSolves();
      renderStats();

      // 3) 실행 취소(Undo) 토스트 호출 및 복구 정의
      showUndoToast(targetSolve, (restoredSolve) => {
        const currentSolves = getSolves();
        currentSolves.unshift(restoredSolve); // 삭제 기록 원복
        saveSolves(currentSolves);

        // UI 재갱신
        renderSolvesList();
        renderRecentSolves();
        renderStats();
      });
    });
  }

  // 7. 더보기(⋮) 메뉴 토글
  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');

  if (moreBtn && contextMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const isHidden = window.getComputedStyle(contextMenu).display === 'none';

      if (isHidden) {
        contextMenu.classList.add('show');
        contextMenu.style.display = 'flex';
      } else {
        contextMenu.classList.remove('show');
        contextMenu.style.display = 'none';
      }
    });

    contextMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      contextMenu.classList.remove('show');
      contextMenu.style.display = 'none';
    });

    document.addEventListener('click', () => {
      if (contextMenu) {
        contextMenu.classList.remove('show');
        contextMenu.style.display = 'none';
      }
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
