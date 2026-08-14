// timer.js

import { getCurrentSession, saveCurrentSession } from './session-manager.js';
import { renderSolvesList } from './solves.js';
import { openSolveBottomSheet } from './solve-bottom-sheet.js';
import { getCurrentEvent, getSolveEvent } from './event.js';
import { requestNewScramble } from './scramble.js';
import { getSetting } from './settings.js';

let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let holdTimeout = null;
let isReady = false;
let isInspecting = false;
let inspectionInterval = null;
let lastTouchEventTime = 0;      // 마지막 실제 터치 이벤트 시각 (ghost mouse event 판별용)
let timerListenersBound = false; // document 레벨 리스너 중복 등록 방지 가드

// 터치 종료 후 브라우저가 자동으로 만들어내는 synthetic mousedown/mouseup을
// 무시하기 위한 유예 시간(ms). 실기기/브라우저별로 보통 300ms 이내에 발생함.
const GHOST_EVENT_WINDOW_MS = 600;

// WCA 관례상 표준 인스펙션 시간(초). 별도 설정 UI 없이 고정값으로 사용.
const INSPECTION_SECONDS = 15;

// 1. 시간 포맷팅 헬퍼
// ms(밀리초)를 1분 미만이면 "12.34", 1분 이상이면 "1:02.34" 형식으로 변환
function msToClock(ms) {
  const totalCentiseconds = Math.round(ms / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centis = totalCentiseconds % 100;

  const secondsStr = String(seconds).padStart(2, '0');
  const centisStr = String(centis).padStart(2, '0');

  return minutes > 0 ? `${minutes}:${secondsStr}.${centisStr}` : `${seconds}.${centisStr}`;
}

export function formatTime(ms, penalty) {
  if (penalty === 'DNF') return 'DNF';

  let totalMs = ms || 0;
  if (penalty === '+2') totalMs += 2000;

  const formatted = msToClock(totalMs);
  return penalty === '+2' ? `${formatted}+` : formatted;
}

// 2. 통계 계산 헬퍼
function calculateAverage(solves, count) {
  if (!solves || solves.length < count) return '-';
  const slice = solves.slice(0, count);
  
  const dnfCount = slice.filter(s => s.penalty === 'DNF').length;
  if (dnfCount > 1) return 'DNF';

  const times = slice.map(s => {
    if (s.penalty === 'DNF') return Infinity;
    return s.time + (s.penalty === '+2' ? 2000 : 0);
  });

  if (count >= 5) {
    times.sort((a, b) => a - b);
    times.pop();
    times.shift();
  }

  const sum = times.reduce((acc, cur) => acc + cur, 0);
  return msToClock(sum / times.length);
}

// 3. Current & Best 통계 렌더링
export function renderStats() {
  const session = getCurrentSession();
  const currentEvent = getCurrentEvent();
  const solves = session
    ? (session.solves || []).filter(s => getSolveEvent(s) === currentEvent)
    : [];

  const timerSummary = document.querySelector('.timer-summary');
  const curAo5 = calculateAverage(solves, 5);
  const curAo12 = calculateAverage(solves, 12);

  if (timerSummary) {
    timerSummary.innerHTML = `
      <div>ao5: ${curAo5} ao12: ${curAo12}</div>
    `;
    timerSummary.style.userSelect = 'none';
    timerSummary.style.webkitUserSelect = 'none';
  }

  const statsTable = document.querySelector('.stats-table');
  if (!statsTable) return;

  const curSingle = solves.length > 0 ? formatTime(solves[0].time, solves[0].penalty) : '-';
  
  const validSolves = solves.filter(s => s.penalty !== 'DNF');
  let bestSingle = '-';
  if (validSolves.length > 0) {
    const bestMs = Math.min(...validSolves.map(s => s.time + (s.penalty === '+2' ? 2000 : 0)));
    bestSingle = msToClock(bestMs);
  }

  statsTable.innerHTML = `
    <div class="row header"><span class="stat-type"></span> <span>Cur</span> <span>Best</span></div>
    <div class="row"><span class="stat-type">time</span> <span>${curSingle}</span> <span>${bestSingle}</span></div>
    <div class="row"><span class="stat-type">mo3</span> <span>${calculateAverage(solves, 3)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao5</span> <span>${curAo5}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao12</span> <span>${curAo12}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao25</span> <span>${calculateAverage(solves, 25)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao50</span> <span>${calculateAverage(solves, 50)}</span> <span>-</span></div>
    <div class="row"><span class="stat-type">ao100</span> <span>${calculateAverage(solves, 100)}</span> <span>-</span></div>
  `;
}

// 4. Recent Solves 목록 렌더링
export function renderRecentSolves() {
  const container = document.querySelector('.recent-solves .solve-list') || 
                    document.querySelector('.solve-list');

  if (!container) return;

  const session = getCurrentSession();
  const currentEvent = getCurrentEvent();
  const solves = session
    ? (session.solves || []).filter(s => getSolveEvent(s) === currentEvent)
    : [];

  if (solves.length === 0) {
    container.innerHTML = '<li style="color:#64748b; font-size:14px; padding: 4px 0;">기록 없음</li>';
    return;
  }

  const recent = solves.slice(0, 5);

  container.style.display = 'block';
  container.style.visibility = 'visible';
  container.style.opacity = '1';

  container.innerHTML = recent
    .map((s, idx) => {
      const num = recent.length - idx;
      const formattedTime = formatTime(s.time, s.penalty);
      return `<li data-id="${s.id}" class="recent-solve-item" style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; cursor: pointer; user-select: none; -webkit-user-select: none;">
        <span class="num" style="color: #64748b; margin-right: 8px; pointer-events: none;">${num}.</span> 
        <span style="font-weight: 600; color: #f8fafc; pointer-events: none;">${formattedTime}</span>
      </li>`;
    })
    .join('');
}

// 5. 메인 타이머 초기화
export function initTimer() {
  const timerDisplay = document.querySelector('.timer-display') || 
                       document.getElementById('timer-display') || 
                       document.querySelector('.timer-zone') ||
                       document.querySelector('.timer');

  if (!timerDisplay) return;

  // initTimer가 실수로 두 번 호출되어도 document 리스너가 중복 등록되지 않게 함
  if (timerListenersBound) return;
  timerListenersBound = true;

  const timerZone = timerDisplay.closest('.timer-zone') || timerDisplay.parentElement;
  if (timerZone) {
    timerZone.style.userSelect = 'none';
    timerZone.style.webkitUserSelect = 'none';
    timerZone.style.webkitTouchCallout = 'none';
  }

  timerDisplay.style.userSelect = 'none';
  timerDisplay.style.webkitUserSelect = 'none';

  setTimeout(() => {
    renderRecentSolves();
    renderStats();
  }, 100);

  // 종목이 바뀌면 Timer 탭의 Recent Solves / Current & Best도 즉시 갱신
  document.addEventListener('cub3:event-changed', () => {
    renderRecentSolves();
    renderStats();
  });

  // 세션이 바뀌면(Session 탭에서 전환하든, 헤더 드롭다운에서 바꾸든) 즉시 갱신
  document.addEventListener('cub3:session-changed', () => {
    renderRecentSolves();
    renderStats();
  });

  function updateDisplay(ms) {
    const mode = getSetting('displayMode');
    if (mode === 'hidden') {
      timerDisplay.textContent = '●';
      return;
    }
    if (mode === 'sec1') {
      timerDisplay.textContent = `${Math.floor(ms / 1000)}`;
      return;
    }
    timerDisplay.textContent = (ms / 1000).toFixed(2);
  }

  function startTimer() {
    isRunning = true;
    startTime = performance.now();
    timerDisplay.style.color = '#ffffff';

    if (getSetting('focusMode') === 'timer-only') {
      document.body.classList.add('cub3-measure-only');
    }

    function tick() {
      if (!isRunning) return;
      elapsedTime = performance.now() - startTime;
      updateDisplay(elapsedTime);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Inspection: 준비 완료 후 바로 시작하는 대신 카운트다운을 먼저 보여줌.
  // 카운트다운 중이든, 0에 도달해 멈춘 뒤든 — 사용자가 직접 눌러야 그 시점에 솔브가 시작됨.
  // (0에 도달해도 자동으로 시작하지 않음)
  function startInspection() {
    isInspecting = true;
    let remaining = INSPECTION_SECONDS;
    timerDisplay.style.color = '#f59e0b';
    timerDisplay.textContent = String(remaining);

    inspectionInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(inspectionInterval);
        timerDisplay.textContent = '0';
        timerDisplay.style.color = '#ef4444'; // 시간 다 됐다는 걸 색으로 표시, 자동 시작은 안 함
        return; // isInspecting은 그대로 true 유지 → 다음 press가 곧 시작 트리거
      }
      timerDisplay.textContent = String(remaining);
    }, 1000);
  }

  function cancelInspectionAndStart() {
    clearInterval(inspectionInterval);
    isInspecting = false;
    startTimer();
  }

  // Ready 완료 후: Inspection 설정이 켜져있으면 인스펙션부터, 아니면 바로 시작
  function beginSolveSequence() {
    if (getSetting('inspectionEnabled')) {
      startInspection();
    } else {
      startTimer();
    }
  }

  // 실제 solve 저장 로직 (자동 측정 종료 / 수동 입력 공통 사용)
  function persistSolve(ms) {
    const session = getCurrentSession();
    if (session) {
      if (!session.solves) session.solves = [];

      const scrambleText = document.querySelector('.scramble-zone .scramble-text')?.textContent || '';

      const newSolve = {
        id: Date.now(),
        time: Math.round(ms),
        penalty: 'NONE',
        createdAt: Date.now(),
        scramble: scrambleText,
        note: '',
        isBookmarked: false,
        event: getCurrentEvent() // 이 solve가 기록된 시점의 종목
      };

      session.solves.unshift(newSolve);
      saveCurrentSession(session);
    }

    renderRecentSolves();
    renderStats();
    if (typeof renderSolvesList === 'function') {
      renderSolvesList();
    }

    // 다음 solve를 위한 새 스크램블 준비
    requestNewScramble();
  }

  function stopTimer() {
    isRunning = false;
    isReady = false; // 방어적 초기화: 다음 press 사이클이 이전 상태를 이어받지 않게 함
    timerDisplay.style.color = '';
    document.body.classList.remove('cub3-measure-only');

    persistSolve(elapsedTime);
  }

  // 최근 기록 클릭시 바텀시트 열기
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.recent-solve-item, [data-id]');
    if (item) {
      const solveId = item.getAttribute('data-id');
      if (solveId) {
        if (typeof openSolveBottomSheet === 'function') {
          openSolveBottomSheet(solveId);
        } else if (window.openSolveBottomSheet) {
          window.openSolveBottomSheet(solveId);
        }
      }
    }
  });

  // 💡 입력 이벤트 핸들러
  function isBottomSheetOpen() {
    const sheet = document.getElementById('detail-bottom-sheet');
    return sheet && (sheet.classList.contains('open') || sheet.classList.contains('active'));
  }

  function handlePressStart(e) {
    // 타이머 입력 방식이 'timer'가 아니면(직접입력/블루투스/스마트큐브) 이 흐름을 쓰지 않음
    if (getSetting('inputMethod') !== 'timer') {
      return;
    }

    // 💡 바텀시트가 열려있을 때 바깥을 터치하면 타이머 실행 금지
    if (isBottomSheetOpen()) {
      return;
    }

    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, #detail-bottom-sheet, .bottom-sheet, .recent-solve-item, .recent-solves, .solve-list, [data-id]')) {
      return;
    }

    // Inspection 중에 누르면 그 즉시 인스펙션을 끝내고 솔브 시작
    if (isInspecting) {
      cancelInspectionAndStart();
      return;
    }

    if (isRunning) {
      clearTimeout(holdTimeout);
      stopTimer();
      return;
    }

    timerDisplay.style.color = '#ef4444';
    isReady = false;

    clearTimeout(holdTimeout);
    holdTimeout = setTimeout(() => {
      isReady = true;
      timerDisplay.style.color = '#22c55e';
    }, getSetting('readyTimeMs'));
  }

  function handlePressEnd(e) {
    if (getSetting('inputMethod') !== 'timer') {
      return;
    }

    // 💡 바텀시트 열려있을 땐 터치 종료도 무시
    if (isBottomSheetOpen()) {
      return;
    }

    if (e && e.target && e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, #detail-bottom-sheet, .bottom-sheet, .recent-solve-item, .recent-solves, .solve-list, [data-id]')) {
      return;
    }

    clearTimeout(holdTimeout);

    if (isRunning || isInspecting) return;

    if (isReady) {
      beginSolveSequence();
    } else {
      timerDisplay.style.color = '';
    }
    isReady = false;
  }

  document.addEventListener('touchstart', (e) => {
    lastTouchEventTime = Date.now();
    handlePressStart(e);
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    lastTouchEventTime = Date.now();
    handlePressEnd(e);
  });

  // 💡 터치 직후 브라우저가 자동으로 쏘는 synthetic(ghost) mousedown/mouseup은
  //    실제 사용자 입력이 아니므로 무시한다 (0.03초 오작동 정지의 근본 원인).
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (Date.now() - lastTouchEventTime < GHOST_EVENT_WINDOW_MS) return;
    handlePressStart(e);
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    if (Date.now() - lastTouchEventTime < GHOST_EVENT_WINDOW_MS) return;
    handlePressEnd(e);
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      handlePressStart();
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      handlePressEnd();
    }
  });

  // 💡 기록 측정 방식: '직접입력'일 때 타이머 존을 탭하면 수동 입력 프롬프트
  document.addEventListener('click', (e) => {
    if (getSetting('inputMethod') !== 'manual') return;
    if (isBottomSheetOpen()) return;
    if (e.target.closest('button, a, input, select, .nav-item, .tab-btn, .record-card, #detail-bottom-sheet, .bottom-sheet, .recent-solve-item, .recent-solves, .solve-list, [data-id]')) return;
    if (!e.target.closest('.timer-zone') && e.target !== timerDisplay) return;

    const input = prompt('Enter time in seconds (e.g. 12.34)');
    if (input === null) return;

    const sec = parseFloat(String(input).replace(',', '.'));
    if (isNaN(sec) || sec < 0) {
      alert('Please enter a valid number.');
      return;
    }

    persistSolve(sec * 1000);
  });

  // 입력 방식이 timer/manual이 아닌 동안(블루투스/스마트큐브)에는
  // 아직 실제 하드웨어 연동이 없다는 걸 화면에 명확히 표시
  function updateInputMethodIndicator() {
    const method = getSetting('inputMethod');
    if (method === 'bluetooth') {
      timerDisplay.textContent = 'Bluetooth timer coming soon';
    } else if (method === 'smartcube') {
      timerDisplay.textContent = 'Smart cube support coming soon';
    } else if (!isRunning && !isInspecting) {
      timerDisplay.textContent = '0.00';
    }
  }

  document.addEventListener('cub3:settings-changed', (e) => {
    if (e.detail && e.detail.key === 'inputMethod') {
      updateInputMethodIndicator();
    }
  });

  updateInputMethodIndicator();
}
