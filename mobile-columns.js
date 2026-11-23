(() => {
  'use strict';

  const rail = document.getElementById('filters');
  const content = document.getElementById('cols');
  const dateBar = document.querySelector('.m-bar');
  const mobile = window.matchMedia('(max-width: 700px)');
  if (!rail || !content || !dateBar || !rail.querySelector('button[data-slug]')) return;

  // The existing filter buttons own the selection and counts on both layouts.
  dateBar.after(rail);
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 700px) {
      .toolbar { padding: 2px 0 0; border-bottom: 0; }
      .toolbar .m-bar { justify-content: flex-start; }
      .toolbar .m-bar label:first-child { flex: none; }
      .toolbar .filters {
        display: flex; flex-wrap: nowrap; align-items: stretch; gap: 16px;
        overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none;
        border-bottom: 1px solid var(--line); max-width: 100%; margin-top: 3px;
      }
      .toolbar .filters::-webkit-scrollbar { display: none; }
      .toolbar .filters button {
        flex: none; white-space: nowrap; min-height: 44px; padding: 0 1px;
        border: 0; border-radius: 0; background: transparent;
        color: var(--muted); font-size: 14px; font-weight: 500;
      }
      .toolbar .filters button[aria-pressed="true"] {
        background: transparent; color: var(--green);
        box-shadow: inset 0 -3px var(--green); font-weight: 700;
      }
      .toolbar .filters button:focus-visible { outline-offset: -3px; }
      #cols { touch-action: pan-y pinch-zoom; }
    }
  `;
  document.head.appendChild(style);
  const oldPicker = document.getElementById('m-col');
  if (oldPicker) oldPicker.closest('label').style.display = 'none';

  function activeButton() {
    return rail.querySelector('button[aria-pressed="true"]');
  }
  function revealSelection() {
    const selected = activeButton();
    if (!mobile.matches || !selected) return;
    const item = selected.getBoundingClientRect();
    const bounds = rail.getBoundingClientRect();
    if (item.left < bounds.left) rail.scrollLeft += item.left - bounds.left - 10;
    if (item.right > bounds.right) rail.scrollLeft += item.right - bounds.right + 10;
  }
  rail.addEventListener('click', revealSelection);
  window.addEventListener('resize', revealSelection);
  document.getElementById('m-date').addEventListener('change', revealSelection);
  revealSelection();

  let start = null;
  content.addEventListener('touchstart', event => {
    start = null;
    if (!mobile.matches || event.touches.length !== 1 || window.getSelection()?.toString()) return;
    const touch = event.touches[0];
    if (touch.clientX < 24 || touch.clientX > document.documentElement.clientWidth - 24) return;
    start = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  content.addEventListener('touchmove', event => {
    if (!start) return;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || Math.abs(touch.clientY - start.y) >
        Math.max(16, Math.abs(touch.clientX - start.x))) start = null;
  }, { passive: true });
  content.addEventListener('touchcancel', () => { start = null; });
  content.addEventListener('touchend', event => {
    const origin = start;
    start = null;
    if (!origin || event.touches.length || !event.changedTouches.length || window.getSelection()?.toString()) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const selected = activeButton();
    const next = dx < 0 ? selected?.nextElementSibling : selected?.previousElementSibling;
    if (!next) return;
    if (event.cancelable) event.preventDefault();
    next.click();
    window.scrollTo(0, 0);
  }, { passive: false });
})();
