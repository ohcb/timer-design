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
  
  // 💡 [핵심 수정!] id 비교 시 String/Number 상관없이 느슨한 비교(==) 적용
  const target = solves.find(s => s.id == id);
  if (!target) {
    console.warn('해당 ID의 Solves 데이터를 찾을 수 없습니다:', id);
    return;
  }

  activeSolveId = target.id; // 안전하게 실제 ID 저장

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
    const currentP = (target.penalty === 'NONE' || !target.penalty) ? 'OK' : target.penalty;
    if (currentP === p) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 💡 [수정] 바텀시트 여는 구문 보강 (flex 및 active 동시에)
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
    btn.addEventListener('click', () =>
