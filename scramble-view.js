// scramble-view.js
// 스크램블 텍스트를 실제 퍼즐 그림으로 보여준다.
// 기존 .cube-net 마크업은 3x3 전용 고정 격자라 Skewb/Megaminx/Pyraminx 등
// 다른 모양의 퍼즐은 표현할 수 없었음 — cubing.js의 <twisty-player>를 쓰면
// 종목별 3D 퍼즐 모양을 우리가 직접 계산하지 않아도 자동으로 그려줌.

import { getCurrentScramble } from './scramble.js';
import { getCurrentEvent } from './event.js';

const TWISTY_LIB_URL = 'https://cdn.cubing.net/v0/js/cubing/twisty';

// 우리 종목 id(WCA 코드) -> cubing.js가 인식하는 퍼즐 형태 id.
// oh/bld/fm/mbld류는 큐브 "모양" 자체는 베이스 큐브와 동일해서 같은 퍼즐로 매핑.
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
let appliedPuzzleId = null; // player.puzzle은 동기적으로 읽을 수 없어서(getter가 비동기 전용) 직접 추적함

function loadTwistyLib() {
  if (!twistyLibPromise) {
    twistyLibPromise = import(TWISTY_LIB_URL);
  }
  return twistyLibPromise;
}

function getContainer() {
  return document.querySelector('.cube-net');
}

// 최초 1회, 기존 3x3 전용 정적 그리드 마크업을 지우고 TwistyPlayer를 붙임
async function ensurePlayer() {
  if (player) return player;

  const container = getContainer();
  if (!container) return null;

  const { TwistyPlayer } = await loadTwistyLib();

  container.innerHTML = '';

  player = new TwistyPlayer({
    puzzle: '3x3x3',
    background: 'none',
    hintFacelets: 'none',
    controlPanel: 'none'
  });

  // 기존 3x3 격자가 있던 작은 카드 슬롯 크기에 맞춤
  player.style.width = '100%';
  player.style.maxWidth = '140px';
  player.style.height = '140px';
  player.style.margin = '0 auto';
  player.style.display = 'block';

  container.appendChild(player);
  return player;
}

async function updateView(scramble, eventId) {
  try {
    const p = await ensurePlayer();
    if (!p) return;

    const puzzleId = PUZZLE_ID_MAP[eventId] || '3x3x3';

    // 💡 TwistyPlayer의 속성은 "쓰기"는 되지만 "읽기"는 비동기 전용이라
    //    p.puzzle 같은 값을 직접 읽어서 비교하면 에러가 나서 아무것도 안 그려짐.
    //    그래서 우리가 마지막으로 적용한 값을 별도 변수로 추적함.
    if (appliedPuzzleId !== puzzleId) {
      p.puzzle = puzzleId;
      appliedPuzzleId = puzzleId;
    }

    // alg는 비워두고 setup으로만 스크램블을 적용해서
    // 재생 컨트롤 없이 "이미 스크램블된 상태"를 그대로 보여줌
    p.alg = '';
    p.experimentalSetupAlg = scramble || '';
  } catch (err) {
    console.error('[ScrambleView] 렌더링 실패:', err);
  }
}

export function initScrambleView() {
  // scramble.js가 스크램블을 새로 만들 때마다(자동 생성/Change/직접입력) 그림도 같이 갱신
  document.addEventListener('cub3:scramble-updated', (e) => {
    if (!e.detail) return;
    updateView(e.detail.scramble, e.detail.eventId);
  });

  // 초기화 순서와 무관하게 동작하도록, 이미 생성돼있는 스크램블이 있으면 즉시 한 번 반영
  const existing = getCurrentScramble();
  if (existing) {
    updateView(existing, getCurrentEvent());
  }
}
