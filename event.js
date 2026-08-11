// event.js
// 종목(Event) 목록 및 "현재 선택된 종목" 상태 관리
// 세션(session-manager.js)과는 독립적인 필터값으로 동작함

import { saveToStorage, loadFromStorage } from './storage.js';

// ==========================================
// 1. 이벤트 목록 (WCA 공식 종목 코드 기준 + FTO)
// ==========================================
export const EVENT_LIST = [
  { id: '333',    name: '3x3' },
  { id: '222',    name: '2x2' },
  { id: '444',    name: '4x4' },
  { id: '555',    name: '5x5' },
  { id: '666',    name: '6x6' },
  { id: '777',    name: '7x7' },
  { id: '333bf',  name: '3BLD' },
  { id: '333fm',  name: 'FMC' },
  { id: '333oh',  name: '3x3 OH' },
  { id: 'minx',   name: 'Megaminx' },
  { id: 'pyram',  name: 'Pyraminx' },
  { id: 'skewb',  name: 'Skewb' },
  { id: 'sq1',    name: 'Square-1' },
  { id: 'fto',    name: 'FTO' },
  { id: 'clock',  name: 'Clock' },
  { id: '444bf',  name: '4BLD' },
  { id: '555bf',  name: '5BLD' },
  { id: '333mbf', name: 'MBLD' }
];

const STORAGE_KEY = 'cub3_current_event';
const DEFAULT_EVENT = '333';

let currentEvent = DEFAULT_EVENT;

// ==========================================
// 2. 조회 함수
// ==========================================

export function getEventList() {
  return EVENT_LIST;
}

export function getEventById(id) {
  return EVENT_LIST.find(e => e.id === id) || null;
}

export function getCurrentEvent() {
  return currentEvent;
}

// ==========================================
// 3. 상태 변경
// ==========================================

export function setCurrentEvent(eventId) {
  if (!getEventById(eventId)) return false;

  currentEvent = eventId;
  saveToStorage(STORAGE_KEY, currentEvent);

  // 다른 모듈(timer, stats, scramble 등)이 이벤트 변경을 구독할 수 있도록
  // 커스텀 이벤트를 전역에 발행 (직접 import 없이도 반응 가능)
  document.dispatchEvent(new CustomEvent('cub3:event-changed', {
    detail: { eventId }
  }));

  return true;
}

// ==========================================
// 4. 렌더링 (상단 종목 드롭다운)
// ==========================================

function renderEventSelect() {
  const select = document.getElementById('event-select');
  if (!select) return;

  select.innerHTML = EVENT_LIST
    .map(e => `<option value="${e.id}">${e.name}</option>`)
    .join('');

  select.value = currentEvent;

  select.addEventListener('change', (e) => {
    setCurrentEvent(e.target.value);
  });
}

// ==========================================
// 5. 초기화
// ==========================================

export function initEventManager() {
  const saved = loadFromStorage(STORAGE_KEY);
  currentEvent = (saved && getEventById(saved)) ? saved : DEFAULT_EVENT;

  renderEventSelect();
}
