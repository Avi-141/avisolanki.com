(() => {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('avi-theme'); } catch {}
  if (!['light', 'dark'].includes(saved)) saved = null;
  function apply(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    if (button) { button.setAttribute('aria-label', label); button.title = label; }
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1b1b1e' : '#f0e9db';
    document.dispatchEvent(new Event('themechange'));
  }
  apply(saved || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('avi-theme', saved); } catch {}
      apply(saved);
    });
  });
  system.addEventListener('change', () => { if (!saved) apply(system.matches ? 'dark' : 'light'); });
})();
