const about = document.getElementById('about');
const opener = document.getElementById('open-about');
opener.addEventListener('click', () => about.showModal());
document.querySelector('[data-close="about"]').addEventListener('click', () => about.close());
about.addEventListener('close', () => opener.focus());

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let scene;
import('./scene.js').then(({ createEpic }) => {
  scene = createEpic(document.getElementById('scene'), reduced.matches);
}).catch(() => { document.getElementById('scene').dataset.renderState = 'poster'; });
reduced.addEventListener('change', event => scene?.setPaused(event.matches));
