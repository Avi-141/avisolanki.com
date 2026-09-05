const pieces = [...document.querySelectorAll('[data-piece]')];
const puzzle = document.getElementById('puzzle');
const status = document.getElementById('puzzle-status');
const mix = document.getElementById('mix');
const progress = document.getElementById('progress');
let turns = [0, 0, 0];

function render() {
  const aligned = turns.filter(turn => turn % 4 === 0).length;
  pieces.forEach((piece, index) => {
    piece.style.setProperty('--turn', turns[index]);
    piece.setAttribute('aria-label', `Rotate ${['left', 'right', 'middle'][index]} piece clockwise; ${turns[index] % 4 === 0 ? 'aligned' : 'not aligned'}`);
  });
  puzzle.dataset.solved = String(aligned === 3);
  progress.textContent = `0${aligned} / 03`;
  status.textContent = aligned === 3 ? 'Things clicked.' : 'A little problem for you.';
}

pieces.forEach((piece, index) => {
  piece.disabled = false;
  piece.addEventListener('click', () => { turns[index]++; render(); });
});
mix.disabled = false;
mix.addEventListener('click', () => {
  // Fixed offsets keep every shuffle solvable in six taps, with no random dead ends.
  turns = turns.map((turn, i) => Math.ceil(turn / 4) * 4 + [1, 3, 2][i]);
  render();
});
