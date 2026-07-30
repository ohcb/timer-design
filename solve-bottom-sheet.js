// solve-bottom-sheet.js

import { getSolves, updateSolvePenalty, deleteSolve, updateSolveNote, toggleSolveBookmark } from './storage.js';
import { getCurrentSession, saveCurrentSession } from './session-manager.js';
import { formatTime, renderRecentSolves, renderStats } from './timer.js';
import { renderSolvesList } from './solves.js';

let activeSolveId = null;
let undoTimer = null;
let lastDeletedSolve = null;

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

export function showUndoToast(deletedSolve, onUndoCallback) {
  const toast = document.getElementById('global-undo-toast');
  const undoBtn = document.getElementById('global-undo-btn');
  if (!toast) return;

  lastDeletedSolve = deletedSolve;
  if (undoTimer) clearTimeout(undoTimer);

  toast.classList.add('show');

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

  undoTimer = setTimeout(() => {
    hideUndoToast();
  }, 4000);
}

export function hideUndoToast() {
  const toast = document.getElementById('global-undo-toast');
  if (toast) {
    toast.classList.remove('show');
  }
  if (undoTimer) clearTimeout(undoTimer);
  lastDeletedSolve = null;
}

export function openSolveBottomSheet(id) {
  const session = getCurrentSession();
  const sessionSolves = session ? (session.solves || []) : [];
  const storageSolves = typeof getSolves === 'function' ? getSolves() : [];

  const solves = [...sessionSolves, ...storageSolves];
  const target = solves.find(s => String(s.id) === String(id));
  if (!target) return;

  activeSolveId = target.id;

  const sheet = document.getElementById('detail-bottom-sheet');
  if (!sheet) return;

  if (sheet.parentElement !== document.body) {
    document.body.appendChild(sheet);
  }

  // 1. 데이터 채우기
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

  // 💡 하단 가려짐 방지 스타일 강제 바인딩
  const sheetContent = sheet.querySelector('.bottom-sheet-content') || sheet;
  if (sheetContent) {
    sheetContent.style.paddingBottom = '32px';
    sheetContent.style.maxHeight = '85vh';
    sheetContent.style.overflowY = 'auto';
  }

  sheet.classList.add('active', 'open');
  sheet.style.setProperty('display', 'flex', 'important');
  sheet.style.setProperty('z-index', '99999', 'important');
}

export function closeSolveBottomSheet() {
  const sheet = document.getElementById('detail-bottom-sheet');
  if (sheet) {
    sheet.classList.remove('active', 'open');
    sheet.style.display = 'none';
  }
  activeSolveId = null;
}

window.openSolveBottomSheet = openSolveBottomSheet;

export function initSolvesManager() {
  const setupSheet = () => {
    const sheet = document.getElementById('detail-bottom-sheet');
    if (sheet && sheet.parentElement !== document.body) {
      document.body.appendChild(sheet);
    }
  };

  setupSheet();
  setTimeout(setupSheet, 500);

  // 바텀시트 외부/닫기 핸들 클릭 시 닫기
  document.addEventListener('click', (e) => {
    const sheet = document.getElementById('detail-bottom-sheet');
    if (!sheet || !sheet.classList.contains('open')) return;

    if (e.target === sheet) {
      closeSolveBottomSheet();
    }
    if (e.target.closest('.bottom-sheet-handle, .drag-handle')) {
      closeSolveBottomSheet();
    }
  });

  // 패널티 변경
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.penalty-segmented-control .penalty-btn, .penalty-btn');
    if (!btn || !activeSolveId) return;

    const sheet = document.getElementById('detail-bottom-sheet');
    if (!sheet || !sheet.contains(btn)) return;

    let penalty = btn.dataset.penalty;
    if (penalty === 'OK') penalty = 'NONE';

    if (typeof updateSolvePenalty === 'function') {
      updateSolvePenalty(activeSolveId, penalty);
    }

    const session = getCurrentSession();
    if (session && session.solves) {
      const target = session.solves.find(s => String(s.id) === String(activeSolveId));
      if (target) target.penalty = penalty;
      saveCurrentSession(session);
    }

    openSolveBottomSheet(activeSolveId);
    renderSolvesList();
    renderRecentSolves();
    renderStats();
  });

  // 메모 작성
  document.addEventListener('input', (e) => {
    if (!e.target.matches('.sheet-note-input') || !activeSolveId) return;
    
    if (typeof updateSolveNote === 'function') {
      updateSolveNote(activeSolveId, e.target.value);
    }

    const session = getCurrentSession();
    if (session && session.solves) {
      const target = session.solves.find(s => String(s.id) === String(activeSolveId));
      if (target) target.note = e.target.value;
      saveCurrentSession(session);
    }
  });

  // 북마크
  document.addEventListener('click', (e) => {
    const bookmarkBtn = e.target.closest('#sheet-bookmark-btn');
    if (!bookmarkBtn || !activeSolveId) return;

    let isBookmarked = false;
    if (typeof toggleSolveBookmark === 'function') {
      isBookmarked = toggleSolveBookmark(activeSolveId);
    }

    const session = getCurrentSession();
    if (session && session.solves) {
      const target = session.solves.find(s => String(s.id) === String(activeSolveId));
      if (target) {
        target.isBookmarked = !target.isBookmarked;
        isBookmarked = target.isBookmarked;
      }
      saveCurrentSession(session);
    }

    bookmarkBtn.textContent = isBookmarked ? '⭐' : '🤍';
    renderSolvesList();
  });

  // 삭제 기능
  document.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('#menu-delete, .delete-item');
    if (!deleteBtn || !activeSolveId) return;

    const session = getCurrentSession();
    if (!session) return;

    const targetIndex = session.solves.findIndex(s => String(s.id) === String(activeSolveId));
    if (targetIndex === -1) return;

    const targetSolve = session.solves[targetIndex];

    session.solves.splice(targetIndex, 1);
    saveCurrentSession(session);

    if (typeof deleteSolve === 'function') {
      deleteSolve(activeSolveId);
    }

    closeSolveBottomSheet();

    renderSolvesList();
    renderRecentSolves();
    renderStats();

    showUndoToast(targetSolve, (restoredSolve) => {
      const curSession = getCurrentSession();
      if (curSession) {
        curSession.solves = curSession.solves || [];
        curSession.solves.unshift(restoredSolve);
        saveCurrentSession(curSession);
      }

      renderSolvesList();
      renderRecentSolves();
      renderStats();
    });
  });

  // 💡 [수정] 더보기 메뉴 토글 및 스크램블 복사
  document.addEventListener('click', (e) => {
    const moreBtn = e.target.closest('#sheet-more-btn, .more-btn, .sheet-more-btn');
    const contextMenu = document.getElementById('sheet-context-menu') || document.querySelector('.sheet-context-menu');

    if (moreBtn && contextMenu) {
      e.stopPropagation();
      const isVisible = contextMenu.classList.contains('show') || window.getComputedStyle(contextMenu).display !== 'none';
      
      if (isVisible) {
        contextMenu.classList.remove('show');
        contextMenu.style.display = 'none';
      } else {
        contextMenu.classList.add('show');
        contextMenu.style.setProperty('display', 'flex', 'important');
        contextMenu.style.setProperty('z-index', '100000', 'important');
      }
      return;
    }

    if (contextMenu && !e.target.closest('#sheet-context-menu, .sheet-context-menu')) {
      contextMenu.classList.remove('show');
      contextMenu.style.display = 'none';
    }

    const copyBtn = e.target.closest('.scramble-copy-btn');
    if (copyBtn) {
      const sheet = document.getElementById('detail-bottom-sheet');
      const scrambleText = sheet?.querySelector('.scramble-text');
      if (scrambleText) {
        navigator.clipboard.writeText(scrambleText.textContent).then(() => {
          copyBtn.textContent = '✅';
          setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
        });
      }
    }
  });
}
