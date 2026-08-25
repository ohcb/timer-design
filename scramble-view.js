// scramble-view.js
// 스크램블 텍스트를 실제 퍼즐 그림(전개도)으로 보여준다.

import { getCurrentScramble } from './scramble.js';
import { getCurrentEvent } from './event.js';

const TWISTY_LIB_URL = 'https://cdn.cubing.net/v0/js/cubing/twisty';

// 우리 종목 id(WCA 코드) -> cubing.js가 인식하는 퍼즐 형태 id
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

  await loadTwistyLib();

  container.innerHTML = '';
  player = document.createElement('twisty-player');

  // 💡 JS 프로퍼티 대입(player.visualization = '2D') 대신 HTML 속성으로 설정.
  //    프로퍼티 대입 방식에서 렌더링이 깨지는 게 확인돼서 속성 방식으로 바꿈.
  player.setAttribute('visualization', '2D');

  // 💡 기본값 보정 (전부 HTML 속성 = kebab-case로 설정해야 실제로 반영됨)
  //    1) background="none"      → twisty-player 기본 흰 배경 제거 (카드 배경이 그대로 비쳐야 함)
  //    2) hint-facelets="none"   → 다음 상태 미리보기용 반투명 스티커 레이어 제거
  //       (이게 "전개도 옆에 반투명하게 붙어보이던" 부분의 정체)
  //    3) back-view="side-by-side" → 뒷면을 작은 인셋으로 우겨넣지 않고 앞면과 동일 크기로 나란히 배치
  //       (Clock처럼 앞/뒤 면이 다 보여야 하는 종목에서 뒷면이 작게 나오던 문제 해결)
  player.setAttribute('background', 'none');
  player.setAttribute('hint-facelets', 'none');
  player.setAttribute('back-view', 'side-by-side');
  // 💡 아래 재생/컨트롤 바 제거: 이 뷰는 "스크램블된 상태의 정적 그림"만 필요하고
  //    알고리즘을 재생/되감기 하는 용도가 아니므로 컨트롤 패널 자체를 끔
  player.setAttribute('control-panel', 'none');

  container.appendChild(player);

  // 기존 3x3 격자가 있던 작은 카드 슬롯 크기에 맞춤
  // 💡 back-view="side-by-side"로 바꾸면서 앞/뒤 면을 나란히 그리는 종목(Clock 등)은
  //    가로 폭이 기존 160px보다 더 필요해서 함께 넉넉하게 조정 (잘림 방지)
  player.style.width = '100%';
  player.style.maxWidth = '220px';
  player.style.height = '140px';
  player.style.margin = '0 auto';
  player.style.display = 'block';

  return player;
}

async function updateView(scramble, eventId) {
  const p = await ensurePlayer();
  if (!p) return;

  const puzzleId = PUZZLE_ID_MAP[eventId] || '3x3x3';
  p.setAttribute('puzzle', puzzleId);

  // alg는 건드리지 않고 setup으로만 스크램블을 적용해서
  // "이미 스크램블된 상태"를 그대로 보여줌
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
