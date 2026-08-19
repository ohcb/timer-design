// scramble.js
// TNoodle(자바 전용, 브라우저 실행 불가)을 대신해
// WCA 공식 스크램블 알고리즘을 JS/WASM으로 포팅한 cubing.js를 사용한다.
// EVENT_LIST의 id(333, pyram, fto ...)가 WCA 공식 종목 코드와 동일해서
// 별도 매핑 없이 그대로 넘기면 된다.

import { getCurrentEvent } from './event.js';

const SCRAMBLE_LIB_URL = 'https://cdn.cubing.net/v0/js/cubing/scramble';

let scrambleLibPromise = null;
let currentScrambleText = '';
let isGenerating = false;

function loadScrambleLib() {
  if (!scrambleLibPromise) {
    scrambleLibPromise = import(SCRAMBLE_LIB_URL);
  }
  return scrambleLibPromise;
}

function getScrambleEl() {
  // 타이머 화면(.scramble-zone)의 스크램블 텍스트만 정확히 타겟팅
  // (바텀시트 안에도 같은 클래스명(.scramble-text)이 있어서 스코프를 좁혀야 함)
  return document.querySelector('.scramble-zone .scramble-text');
}

export function getCurrentScramble() {
  return currentScrambleText;
}

// 다른 모듈(scramble-view.js 등)이 "스크램블이 바뀌었다"는 걸 구독할 수 있도록 알림
function broadcastScrambleUpdate(eventId) {
  document.dispatchEvent(new CustomEvent('cub3:scramble-updated', {
    detail: { scramble: currentScrambleText, eventId }
  }));
}

async function generateScramble() {
  const el = getScrambleEl();
  if (!el) return;

  isGenerating = true;
  el.textContent = '스크램블 생성 중...';

  const requestedEvent = getCurrentEvent();

  try {
    const { randomScrambleForEvent } = await loadScrambleLib();
    const alg = await randomScrambleForEvent(requestedEvent);
    currentScrambleText = alg.toString();
  } catch (err) {
    console.error('[Scramble] 생성 실패:', err);
    currentScrambleText = '스크램블 생성 실패 · Change를 눌러 재시도';
  }

  // 생성되는 동안 사용자가 다른 종목으로 바꿨으면 그 결과는 버림 (경쟁 상태 방지)
  if (getCurrentEvent() === requestedEvent) {
    el.textContent = currentScrambleText;
    broadcastScrambleUpdate(requestedEvent);
  }

  isGenerating = false;
}

// 다른 모듈(timer.js 등)에서 "새 스크램블 필요해짐" 시점에 호출
export function requestNewScramble() {
  generateScramble();
}

export function initScramble() {
  generateScramble();

  // 종목이 바뀌면 그 종목에 맞는 스크램블을 새로 생성
  document.addEventListener('cub3:event-changed', () => {
    generateScramble();
  });

  document.addEventListener('click', (e) => {
    const btnGroup = e.target.closest('.scramble-actions');
    if (!btnGroup) return;

    const buttons = Array.from(btnGroup.querySelectorAll('.plain-btn'));
    const idx = buttons.indexOf(e.target.closest('.plain-btn'));
    if (idx === -1) return;

    // 순서 고정: [0]=Copy, [1]=Edit, [2]=Change
    if (idx === 0) {
      navigator.clipboard.writeText(currentScrambleText).then(() => {
        const btn = buttons[0];
        const original = btn.textContent;
        btn.textContent = '✅';
        setTimeout(() => { btn.textContent = original; }, 1200);
      });
    } else if (idx === 1) {
      const input = prompt('스크램블을 직접 입력하세요', currentScrambleText);
      if (input !== null && input.trim()) {
        currentScrambleText = input.trim();
        const el = getScrambleEl();
        if (el) el.textContent = currentScrambleText;
        broadcastScrambleUpdate(getCurrentEvent());
      }
    } else if (idx === 2) {
      if (!isGenerating) generateScramble();
    }
  });
}
