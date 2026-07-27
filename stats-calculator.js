// stats-calculator.js

// 1. 단일 최저 기록 (PB)
export function getBestTime(solves) {
  if (!solves || solves.length === 0) return null;
  const validSolves = solves.filter(s => s.penalty !== 'DNF');
  if (validSolves.length === 0) return null;
  return Math.min(...validSolves.map(s => s.time));
}

// 2. Trimmed Mean 계산 (WCA 공식 규격 ao5, ao12)
export function calculateAoN(solves, n) {
  if (!solves || solves.length < n) return null;

  // 최근 N개 가져오기
  const targetSolves = solves.slice(0, n);

  // 패널티 반영 (+2 시 2000ms 추가, DNF는 Infinity)
  const times = targetSolves.map(s => {
    if (s.penalty === 'DNF') return Infinity;
    return s.time + (s.penalty === '+2' ? 2000 : 0);
  });

  // DNF가 2개 이상이면 해당 세트는 DNF
  const dnfCount = times.filter(t => t === Infinity).length;
  if (dnfCount >= 2) return 'DNF';

  // 최고/최악 기록 1개씩 제외 후 평균 계산
  times.sort((a, b) => a - b);
  const trimmed = times.slice(1, times.length - 1);
  const sum = trimmed.reduce((acc, cur) => acc + cur, 0);

  return Math.round(sum / trimmed.length);
}
