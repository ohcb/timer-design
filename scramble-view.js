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
 
  container.appendChild(player);
 
  // 기존 3x3 격자가 있던 작은 카드 슬롯 크기에 맞춤
  player.style.width = '100%';
  player.style.maxWidth = '160px';
  player.style.height = '120px';
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
