/* Client protection deterrence — not a security boundary. */
(() => {
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
  document.addEventListener('contextmenu', stop, { capture: true });
  document.addEventListener('dragstart', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'IMG') stop(e);
  }, { capture: true });
  document.addEventListener('keydown', (e) => {
    const k = String(e.key || '').toLowerCase();
    if (k === 'f12' ||
        (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(k)) ||
        (e.ctrlKey && ['u','s'].includes(k))) {
      stop(e);
    }
  }, { capture: true });
})();
