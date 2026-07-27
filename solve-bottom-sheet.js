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
  // 💡 타입 변환(String)을 추가하여 id 비교 오류 방지
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
  const penaltyBtns = sheet.querySelectorAll('.penalty-segmented-control .penalty-btn');
  penaltyBtns.forEach(btn => {
    const p = btn.dataset.penalty;
    const currentP = (target.penalty === 'NONE' || !target.penalty) ? 'OK' : target.penalty;
    if (currentP === p) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 💡 확실하게 띄우기 (flex 스타일 지정)
  sheet.classList.add('active');
  sheet.style.display = 'flex';
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

  // 7. 더보기(⋮) 메뉴 토글 (인라인 스타일 우선 제어)
  const moreBtn = document.getElementById('sheet-more-btn');
  const contextMenu = document.getElementById('sheet-context-menu');

  if (moreBtn && contextMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 바텀시트가 닫히거나 다른 클릭 이벤트와 충돌하는 것을 방지

      // 현재 닫혀있는지 확인
      const isHidden = window.getComputedStyle(contextMenu).display === 'none';

      if (isHidden) {
        contextMenu.classList.add('show');
        contextMenu.style.display = 'flex'; // 강제로 flex 지정
      } else {
        contextMenu.classList.remove('show');
        contextMenu.style.display = 'none'; // 강제로 숨김
      }
    });

    // 메뉴 항목(Edit, Delete) 클릭 시 메뉴 닫기
    contextMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      contextMenu.classList.remove('show');
      contextMenu.style.display = 'none';
    });

    // 바깥 영역 클릭 시 메뉴 닫기
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

// solve-bottom-sheet.js

let undoTimer = null;
let lastDeletedSolve = null; // 실행 취소(Undo)할 마지막 데이터 저장

// 💡 Undo 토스트 띄우기 함수
export function showUndoToast(deletedSolve, onUndoCallback) {
  const toast = document.getElementById('global-undo-toast');
  const undoBtn = document.getElementById('global-undo-btn');
  if (!toast) return;

  lastDeletedSolve = deletedSolve;

  // 기존 타이머가 작동 중이면 리셋
  if (undoTimer) clearTimeout(undoTimer);

  // 토스트 강제 출력
  toast.classList.add('show');
  toast.style.setProperty('display', 'flex', 'important');
  toast.style.setProperty('opacity', '1', 'important');

  // Undo 버튼 이벤트 등록 (한 번만 실행되도록 { once: true })
  if (undoBtn) {
    // 기존 리스너 중복 방지를 위해 클론 또는 이벤트 교체
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
