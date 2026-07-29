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

// 💡 [해결] 세션 및 storage 양쪽에서 정밀 검색
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

  sheet.classList.add('active', 'open');
  sheet.style.display = 'flex';
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
  const sheet = document.getElementById('detail-bottom-sheet');
  if (!sheet) return;

  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSolveBottomSheet();
  });

  const handle = sheet.querySelector('.bottom-sheet-handle, .drag-handle');
  if (handle) handle.addEventListener('click', closeSolveBottomSheet);

  // 패널티 변경
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn, .penalty-btn');
  penaltyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!activeSolveId) return;

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
  });

  // 메모 작성
  const noteInput = sheet.querySelector('.sheet-note-input');
  if (noteInput) {
    noteInput.addEventListener('input', (e) => {
      if (!activeSolveId) return;
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
  }

  // 북마크
  const bookmarkBtn = document.getElementById('sheet-bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => {
      if (!activeSolveId) return;
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
  }

  // 삭제 기능
  const deleteBtn = sheet.querySelector('#menu-delete, .delete-item');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!activeSolveId) return;

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
  }

  // 더보기 메뉴
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

  // 복사 기능
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
