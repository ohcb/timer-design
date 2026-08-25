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

  try {
    container.innerHTML = '';
    const el = document.createElement('twisty-player');

    // 💡 JS 프로퍼티 대입(player.visualization = '2D') 대신 HTML 속성으로 설정.
    //    프로퍼티 대입 방식에서 렌더링이 깨지는 게 확인돼서 속성 방식으로 바꿈.
    el.setAttribute('visualization', '2D');

    // 💡 기본값 보정 (전부 HTML 속성 = kebab-case로 설정해야 실제로 반영됨)
    //    1) background="none"      → twisty-player 기본 흰 배경 제거
    //    2) hint-facelets="none"   → 다음 상태 미리보기용 반투명 스티커 레이어 제거
    //    3) back-view="side-by-side" → 뒷면을 앞면과 동일 크기로 나란히 배치
    el.setAttribute('background', 'none');
    el.setAttribute('hint-facelets', 'none');
    el.setAttribute('back-view', 'side-by-side');

    container.appendChild(el);

    // 기존 3x3 격자가 있던 작은 카드 슬롯 크기에 맞춤
    el.style.width = '100%';
    el.style.maxWidth = '220px';
    el.style.height = '140px';
    el.style.margin = '0 auto';
    el.style.display = 'block';

    // 💡 하단 재생바(컨트롤 패널) 제거 시도.
    //    control-panel="none"을 속성(setAttribute)으로 주면 이 라이브러리 버전에서
    //    내부적으로 렌더링이 깨지는 현상이 확인돼서(= 화면이 통째로 사라짐),
    //    속성 대신 JS 프로퍼티 대입으로 바꿔서 시도함.
    try {
      el.controlPanel = 'none';
    } catch (panelErr) {
      console.warn('[ScrambleView] control-panel 설정 실패(무시하고 계속 진행):', panelErr);
    }

    player = el;
  } catch (err) {
    // 💡 생성 도중 어떤 이유로든 실패하면 player를 null로 되돌려서
    //    다음 updateView() 호출 때 처음부터 다시 시도하게 함.
    //    (이걸 안 하면 깨진 인스턴스가 캐시된 채 계속 재사용되면서
    //     모든 종목에서 영구적으로 빈 화면이 나오는 문제가 생김)
    console.error('[ScrambleView] twisty-player 생성 실패:', err);
    container.innerHTML = '';
    player = null;
    return null;
  }

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
