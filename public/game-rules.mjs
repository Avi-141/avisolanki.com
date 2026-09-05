const TAU = Math.PI * 2;
export const angleDistance = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
export const alignedPieces = turns => turns.filter(turn => turn % 4 === 0).length;
export function catchOrbit(state, angle, target) {
  const hit = angleDistance(angle % TAU, target) <= 0.43;
  const hits = state.hits + Number(hit), misses = state.misses + Number(!hit);
  return { hits, misses, hit, done: hits >= 5 || misses >= 3 };
}
export const newFlight = () => ({ x: 160, bullets: [], enemies: [], hits: 0, misses: 0, fireIn: 0, spawnIn: 0, done: false });
export function stepFlight(state, dt, targetX, spawnX) {
  if (state.done) return;
  dt = Math.min(Math.max(dt, 0), .05);
  state.x += Math.max(-230 * dt, Math.min(230 * dt, targetX - state.x));
  state.x = Math.max(16, Math.min(304, state.x));
  state.fireIn -= dt; state.spawnIn -= dt;
  if (state.fireIn <= 0) { state.bullets.push({ x: state.x, y: 231 }); state.fireIn = .28; }
  if (state.spawnIn <= 0) { state.enemies.push({ x: Math.max(20, Math.min(300, spawnX)), y: -12 }); state.spawnIn = .9; }
  for (const bullet of state.bullets) bullet.y -= 250 * dt;
  for (const enemy of state.enemies) {
    enemy.y += (38 + state.hits * 1.7) * dt;
    const bullet = state.bullets.find(b => !b.hit && Math.abs(b.x - enemy.x) < 15 && Math.abs(b.y - enemy.y) < 16);
    if (bullet) { bullet.hit = true; enemy.gone = true; state.hits++; }
    else if (enemy.y > 258 || (enemy.y > 227 && Math.abs(enemy.x - state.x) < 20)) { enemy.gone = true; state.misses++; }
    if (state.hits >= 12 || state.misses >= 3) { state.done = true; break; }
  }
  state.bullets = state.bullets.filter(b => !b.hit && b.y > -10);
  state.enemies = state.enemies.filter(e => !e.gone);
}
