// settings.js
// Timer Settings / Appearance / Preferences 값을 관리하고
// localStorage에 저장/복원하며, Settings 화면의 실제 컨트롤과 연결한다.

import { saveToStorage, loadFromStorage } from './storage.js';

const STORAGE_KEY = 'cub3_settings';

const DEFAULT_SETTINGS = {
  readyTimeMs: 300,        // Ready 시간 (홀드 후 준비완료까지)
  inputMethod: 'timer',    // 'timer' | 'manual' | 'bluetooth' | 'smartcube'
  displayMode: 'realtime', // 'hidden' | 'realtime' | 'sec1'
  focusMode: 'timer-only', // 'timer-only' | 'fullscreen'
  themeId: 'dark-purple',  // theme ID (여러 테마 확장 가능)
  roundness: 1,            // 전역 CSS 변수 --roundness-scale 배율
  inspectionEnabled: true  // Inspection 기본 ON
};

let settings = { ...DEFAULT_SETTINGS };

function persist() {
  saveToStorage(STORAGE_KEY, settings);
}

// ==========================================
// 1. 조회/변경
// ==========================================

export function getSetting(key) {
  return settings[key];
}

export function getAllSettings() {
  return { ...settings };
}

export function setSetting(key, value) {
  if (!(key in DEFAULT_SETTINGS)) return;

  settings[key] = value;
  persist();
  applyVisualSetting(key, value);

  // timer.js 등 다른 모듈이 즉시 반응할 수 있도록 전역 이벤트 발행
  document.dispatchEvent(new CustomEvent('cub3:settings-changed', {
    detail: { key, value }
  }));
}

// ==========================================
// 2. 전역 CSS/DOM에 즉시 반영해야 하는 설정 (Theme, Roundness)
// ==========================================

function applyVisualSetting(key, value) {
  if (key === 'themeId') {
    document.documentElement.setAttribute('data-theme', value);
  }
  if (key === 'roundness') {
    document.documentElement.style.setProperty('--roundness-scale', value);
  }
}

function applyAllVisualSettings() {
  applyVisualSetting('themeId', settings.themeId);
  applyVisualSetting('roundness', settings.roundness);
}

// ==========================================
// 3. Settings 화면 컨트롤 바인딩
// ==========================================

function bindSelect(id, key, parseAsNumber = false) {
  const el = document.getElementById(id);
  if (!el) return;

  el.value = settings[key];
  el.addEventListener('change', (e) => {
    const raw = e.target.value;
    setSetting(key, parseAsNumber ? Number(raw) : raw);
  });
}

function bindRange(id, key) {
  const el = document.getElementById(id);
  if (!el) return;

  el.value = settings[key];
  el.addEventListener('input', (e) => {
    setSetting(key, Number(e.target.value));
  });
}

function bindToggle(id, key) {
  const el = document.getElementById(id);
  if (!el) return;

  el.checked = !!settings[key];
  el.addEventListener('change', (e) => {
    setSetting(key, e.target.checked);
  });
}

function renderSettingsUI() {
  bindSelect('setting-ready-time', 'readyTimeMs', true);
  bindSelect('setting-input-method', 'inputMethod');
  bindSelect('setting-display-mode', 'displayMode');
  bindSelect('setting-focus-mode', 'focusMode');
  bindSelect('setting-theme', 'themeId');
  bindRange('setting-roundness', 'roundness');
  bindToggle('setting-inspection', 'inspectionEnabled');
}

// ==========================================
// 4. 초기화
// ==========================================

export function initSettings() {
  const saved = loadFromStorage(STORAGE_KEY);
  settings = { ...DEFAULT_SETTINGS, ...(saved || {}) };

  // Appearance 설정은 Settings 화면을 열지 않아도 앱 전체에 바로 적용돼야 함
  applyAllVisualSettings();

  // Settings 화면의 실제 input들과 현재 값 동기화 + change 리스너 연결
  renderSettingsUI();
}
