// solves-filter.js
// Solves 탭 기록 필터: 패널티 / 북마크 / 날짜
// 필터링 조건(matchesFilters)은 이 모듈이 소유하고, 실제 목록 재렌더링은
// solves.js의 renderSolvesList()를 호출해서 위임한다.

import { renderSolvesList } from './solves.js';

let filters = {
  penalty: 'all',   // 'all' | 'ok' | '+2' | 'dnf'
  bookmark: 'all',  // 'all' | 'bookmarked'
  date: 'all'       // 'all' | 'today' | '7days' | '30days'
};

// ==========================================
// 1. 필터 판정
// ==========================================

export function matchesFilters(solve) {
  // 패널티
  if (filters.penalty === 'ok' && solve.penalty !== 'NONE') return false;
  if (filters.penalty === '+2' && solve.penalty !== '+2') return false;
  if (filters.penalty === 'dnf' && solve.penalty !== 'DNF') return false;

  // 북마크
  if (filters.bookmark === 'bookmarked' && !solve.isBookmarked) return false;

  // 날짜
  if (filters.date !== 'all') {
    const ts = solve.createdAt || solve.id;
    const now = Date.now();

    if (filters.date === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (ts < startOfToday.getTime()) return false;
    } else if (filters.date === '7days') {
      if (ts < now - 7 * 24 * 60 * 60 * 1000) return false;
    } else if (filters.date === '30days') {
      if (ts < now - 30 * 24 * 60 * 60 * 1000) return false;
    }
  }

  return true;
}

export function hasActiveFilters() {
  return filters.penalty !== 'all' || filters.bookmark !== 'all' || filters.date !== 'all';
}

// ==========================================
// 2. UI 헬퍼
// ==========================================

function updateTriggerBtnBadge() {
  const btn = document.getElementById('filter-trigger-btn');
  if (!btn) return;

  const active = hasActiveFilters();
  let dot = btn.querySelector('.filter-active-dot');

  if (active && !dot) {
    dot = document.createElement('span');
    dot.className = 'filter-active-dot';
    btn.appendChild(dot);
  } else if (!active && dot) {
    dot.remove();
  }
}

function openSheet() {
  const overlay = document.getElementById('solves-filter-overlay');
  if (overlay) overlay.style.setProperty('display', 'flex', 'important');
}

function closeSheet() {
  const overlay = document.getElementById('solves-filter-overlay');
  if (overlay) overlay.style.display = 'none';
}

function selectChip(type, value) {
  filters[type] = value;

  const overlay = document.getElementById('solves-filter-overlay');
  if (!overlay) return;

  overlay.querySelectorAll(`.chip-btn[data-filter-type="${type}"]`).forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-filter-value') === value);
  });
}

function resetFilters() {
  filters = { penalty: 'all', bookmark: 'all', date: 'all' };

  const overlay = document.getElementById('solves-filter-overlay');
  if (!overlay) return;

  overlay.querySelectorAll('.chip-btn').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-filter-value') === 'all');
  });
}

// ==========================================
// 3. 초기화
// ==========================================

export function initSolvesFilter() {
  const triggerBtn = document.getElementById('filter-trigger-btn');
  const overlay = document.getElementById('solves-filter-overlay');
  if (!triggerBtn || !overlay) return;

  triggerBtn.addEventListener('click', openSheet);

  overlay.addEventListener('click', (e) => {
    // 바깥(반투명 배경) 클릭 시 닫기
    if (e.target === overlay) {
      closeSheet();
      return;
    }

    const chip = e.target.closest('.chip-btn[data-filter-type]');
    if (chip) {
      selectChip(chip.getAttribute('data-filter-type'), chip.getAttribute('data-filter-value'));
      return;
    }

    if (e.target.closest('#solves-filter-reset-btn')) {
      resetFilters();
      renderSolvesList();
      updateTriggerBtnBadge();
      return;
    }

    if (e.target.closest('#solves-filter-apply-btn')) {
      closeSheet();
      renderSolvesList();
      updateTriggerBtnBadge();
      return;
    }
  });
}
