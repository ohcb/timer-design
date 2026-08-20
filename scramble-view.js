// scramble-view.js
// 스크램블 텍스트를 실제 퍼즐 그림으로 보여준다.
// (지금은 렌더링 자체가 되는지 확인하려고 최소 구성으로 단순화한 버전 —
//  직접 콘솔 테스트에서 확실히 동작했던 방식과 완전히 동일하게 맞춤)

import { getCurrentScramble } from './scramble.js';
import { getCurrentEvent } from './event.js';

const TWISTY_LIB_URL = 'https://cdn.cubing.net/v0/js/cubing/twisty';

const PUZZLE_ID_MAP = {
  '333': '3x3x3', '333oh': '3x3x3', '333bf': '3x3x3', '333fm': '3x3x3', '333mbf': '3x3x3',
  '222': '2x2x2',
  '444': '4x4x4', '444bf': '4x4x4',
  '555': '5x5x5', '555bf': '5x5x5',
  '666': '6x6x6',
  '777': '7x7x7',
  'minx': 'megaminx',
  'pyram': 'pyraminx',
  'skewb': 'skewb',
  'sq1': 'square1',
  'clock': 'clock',
  'fto': 'fto'
};

let twistyLibPromise = null;
let player = null;

function loadTwistyLib() {
  if (!twistyLibPromise) {
    twistyLibPromise = import(TWISTY_LIB_URL);
  }
  return twistyLibPromise;
}

function getContainer() {
  return document.querySelector('.cube-net');
}

async function ensurePlayer() {
  if (player) return player;

  const container = getContainer();
  if (!container) return null;

  // 직접 테스트와 동일하게: import는 등록용으로만 쓰고, 별다른 옵션 없이
  // createElement로 만들어서 바로 컨테이너에 붙임
  await loadTwistyLib();

  container.innerHTML = '';
  player = document.createElement('twisty-player');
  container.appendChild(player);

  return player;
}

async function updateView(scramble, eventId) {
  const p = await ensurePlayer();
  if (!p) return;

  // 지금은 종목 구분 없이 우선 스크램블만 반영해서 "뭐라도 뜨는지"부터 확인
  p.experimentalSetupAlg = scramble || '';
}

export function initScrambleView() {
  document.addEventListener('cub3:scramble-updated', (e) => {
    if (!e.detail) return;
    updateView(e.detail.scramble, e.detail.eventId);
  });

  const existing = getCurrentScramble();
  if (existing) {
    updateView(existing, getCurrentEvent());
  }
}
