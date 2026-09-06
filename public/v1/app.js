import { alignedPieces, catchOrbit, newFlight, stepFlight } from '../game-rules.mjs';
const $ = id => document.getElementById(id);
const arcade = $('arcade'), orbitButton = $('orbit-action'), flightButton = $('flight-action');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let scene, game = 'assembly', playing = false, frame = 0, last = 0;
import('../dawn-scene.js').then(({ createDawn }) => { scene = createDawn($('scene'), reduced.matches); }).catch(() => {});
reduced.addEventListener('change', e => scene?.setPaused(e.matches));

const pieces = [...document.querySelectorAll('[data-piece]')];
let turns = [];
function drawAssembly() {
  const aligned = alignedPieces(turns);
  pieces.forEach((piece, i) => {
    piece.style.setProperty('--turn', turns[i]);
    piece.setAttribute('aria-label', `Rotate ${['left', 'right', 'middle'][i]} piece, ${turns[i] % 4 === 0 ? 'aligned' : 'not aligned'}`);
  });
  $('assembly-status').textContent = aligned === 3 ? 'Fits together.' : `${aligned} / 3 aligned`;
  if (aligned === 3) scene?.pulse();
}
function mixAssembly() { turns = pieces.map(() => 1 + Math.floor(Math.random() * 3)); drawAssembly(); }
pieces.forEach((piece, i) => piece.addEventListener('click', () => { turns[i]++; drawAssembly(); }));
$('assembly-mix').addEventListener('click', mixAssembly);
mixAssembly();

let angle = -Math.PI / 2, target = 0, orbit = { hits: 0, misses: 0 };
let flight = newFlight(), targetX = 160;
const keys = new Set(), canvas = $('flight-canvas'), ctx = canvas.getContext('2d');
let flightColors;
function refreshFlightColors() {
  const css = getComputedStyle(document.documentElement);
  flightColors = { ink: css.getPropertyValue('--game-ink'), target: css.getPropertyValue('--game-target'), grid: css.getPropertyValue('--game-grid') };
}
refreshFlightColors();
document.addEventListener('themechange', () => { refreshFlightColors(); if (game === 'flight') drawFlight(); });
function stop() { playing = false; cancelAnimationFrame(frame); keys.clear(); }
function selectGame(name) {
  stop(); game = name;
  document.querySelectorAll('[data-game]').forEach(button => {
    const selected = button.dataset.game === name;
    button.setAttribute('aria-pressed', String(selected));
    $(`${button.dataset.game}-panel`).hidden = !selected;
  });
  orbitButton.textContent = flightButton.textContent = 'Start ↗';
  $('orbit-status').textContent = 'Five catches to win.';
  $('flight-status').textContent = 'Ready when you are.';
  if (name === 'flight') { flight = newFlight(); updateFlight(); drawFlight(); }
}
document.querySelectorAll('[data-game]').forEach(button => button.addEventListener('click', () => selectGame(button.dataset.game)));
$('open-games').addEventListener('click', () => { selectGame(game); arcade.showModal(); });
$('close-games').addEventListener('click', () => arcade.close());
arcade.addEventListener('close', () => { stop(); $('open-games').focus(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playing) {
    stop(); $(`${game}-status`).textContent = 'Paused. Start again when you’re ready.';
    $(`${game}-action`).textContent = 'Restart ↗';
  }
});

function orbitAction() {
  if (!playing) {
    orbit = { hits: 0, misses: 0 }; target = 0; angle = -Math.PI / 2;
    $('target-arc').style.transform = 'rotate(0rad)';
    $('orbit-score').textContent = '0 / 5'; $('lives').textContent = '3 chances left';
    $('orbit-status').textContent = 'Catch the spark inside the arc.';
    orbitButton.textContent = 'Catch'; playing = true; last = performance.now(); frame = requestAnimationFrame(animate); return;
  }
  orbit = catchOrbit(orbit, angle, target);
  $('orbit-score').textContent = `${orbit.hits} / 5`; $('lives').textContent = `${3 - orbit.misses} chances left`;
  $('orbit-status').textContent = orbit.hit ? 'Nice catch.' : 'Just missed. Try the next pass.';
  if (orbit.hit) { scene?.pulse(); target = (target + 1.7) % (Math.PI * 2); $('target-arc').style.transform = `rotate(${target}rad)`; }
  if (orbit.done) {
    stop(); orbitButton.textContent = 'Play again ↗';
    $('orbit-status').textContent = orbit.hits === 5 ? 'Five for five.' : 'Another go?';
  }
}
orbitButton.addEventListener('click', orbitAction);

function updateFlight() {
  $('flight-score').textContent = `${flight.hits} / 12`;
  $('flight-status').textContent = flight.done ? (flight.hits >= 12 ? 'Path cleared.' : 'Another go?') : `${3 - flight.misses} chances left`;
}
function drawFlight() {
  ctx.clearRect(0, 0, 320, 270);
  ctx.strokeStyle = flightColors.grid; ctx.lineWidth = 1;
  for (let x = 40; x < 320; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 270); ctx.stroke(); }
  ctx.fillStyle = flightColors.ink;
  for (const b of flight.bullets) ctx.fillRect(b.x - 1, b.y - 5, 2, 9);
  ctx.strokeStyle = flightColors.target; ctx.lineWidth = 1.5;
  for (const e of flight.enemies) {
    ctx.beginPath(); ctx.moveTo(e.x, e.y - 10); ctx.lineTo(e.x + 10, e.y); ctx.lineTo(e.x, e.y + 10); ctx.lineTo(e.x - 10, e.y); ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = flightColors.ink; ctx.beginPath(); ctx.moveTo(flight.x, 230); ctx.lineTo(flight.x + 12, 253); ctx.lineTo(flight.x, 248); ctx.lineTo(flight.x - 12, 253); ctx.closePath(); ctx.fill();
  if (playing) { ctx.fillStyle = '#b88650'; ctx.fillRect(flight.x - 2, 255, 4, 4 + Math.random() * 4); }
}
flightButton.addEventListener('click', () => {
  stop(); flight = newFlight(); targetX = 160; playing = true;
  flightButton.textContent = 'Restart ↗'; updateFlight(); last = performance.now(); frame = requestAnimationFrame(animate);
});
function steer(event) {
  const rect = canvas.getBoundingClientRect();
  targetX = Math.max(16, Math.min(304, (event.clientX - rect.left) / rect.width * 320));
}
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); steer(e); });
canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || canvas.hasPointerCapture(e.pointerId)) steer(e); });
$('flight-left').addEventListener('click', () => { targetX = Math.max(16, targetX - 38); });
$('flight-right').addEventListener('click', () => { targetX = Math.min(304, targetX + 38); });
arcade.addEventListener('keydown', event => {
  if (game === 'flight' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); keys.add(event.key); }
  if (!event.repeat && game === 'orbit' && event.code === 'Space' && event.target.tagName !== 'BUTTON') { event.preventDefault(); orbitAction(); }
});
window.addEventListener('keyup', e => keys.delete(e.key));
window.addEventListener('blur', () => keys.clear());
function animate(now) {
  if (!playing) return;
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (game === 'orbit') {
    angle += dt * (1.15 + orbit.hits * .17);
    $('orbit-hand').style.transform = `rotate(${angle}rad)`;
  } else if (game === 'flight') {
    if (keys.size) targetX = flight.x + (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * 230 * dt;
    const oldHits = flight.hits, oldMisses = flight.misses;
    stepFlight(flight, dt, targetX, 25 + Math.random() * 270);
    drawFlight();
    if (oldHits !== flight.hits || oldMisses !== flight.misses) updateFlight();
    if (flight.done) { stop(); flightButton.textContent = 'Play again ↗'; if (flight.hits >= 12) scene?.pulse(); return; }
  }
  frame = requestAnimationFrame(animate);
}
