(() => {
  'use strict';

  const rail = document.getElementById('filters');
  const content = document.getElementById('cols');
  const dateBar = document.querySelector('.m-bar');
  const mobile = window.matchMedia('(max-width: 700px)');
  if (!rail || !content || !dateBar || !rail.querySelector('button[data-slug]')) return;

  // The existing filter buttons own the selection and counts on both layouts.
  dateBar.after(rail);
  const toolbar = dateBar.closest('.toolbar');
  const wrap = toolbar.parentElement;
  const pane = document.createElement('div');
  pane.className = 'reading-pane';
  content.before(pane);
  pane.append(content);
  const footer = wrap.querySelector('.page-foot');
  if (footer) pane.append(footer);
  if (navigator.standalone) document.documentElement.classList.add('home-screen');
  const title = wrap.querySelector('.top h1').cloneNode(true);
  title.className = 'mobile-masthead';
  dateBar.prepend(title);
  const style = document.createElement('style');
  style.textContent = `
    .reading-pane { display: contents; }
    .mobile-masthead { display: none; }
    @media (max-width: 700px) {
      .wrap {
        display: flex; flex-direction: column; height: 100vh; height: 100dvh;
        padding: env(safe-area-inset-top, 0px) 0 0; overflow: hidden;
      }
      .wrap > header.top { display: none; }
      .mobile-masthead { display: block; margin: 0; font-size: 1.2rem; color: var(--green); }
      .wrap .toolbar { flex: none; padding-inline: 14px; }
      .wrap .m-bar { justify-content: space-between; align-items: center; }
      .m-bar label { flex: none; width: auto; }
      .reading-pane {
        display: block; flex: 1 1 0%; min-height: 0; overflow-y: auto;
        overscroll-behavior-y: contain; touch-action: pan-y pinch-zoom;
        padding: 0 14px max(24px, env(safe-area-inset-bottom));
      }
      .toolbar { padding: 2px 0 0; border-bottom: 0; }
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
  pane.addEventListener('touchstart', event => {
    start = null;
    if (!mobile.matches || event.touches.length !== 1 || window.getSelection()?.toString()) return;
    const touch = event.touches[0];
    if (touch.clientX < 22 || touch.clientX > document.documentElement.clientWidth - 22) return;
    start = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  pane.addEventListener('touchmove', event => {
    if (!start) return;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || Math.abs(touch.clientY - start.y) >
        Math.max(16, Math.abs(touch.clientX - start.x))) start = null;
  }, { passive: true });
  pane.addEventListener('touchcancel', () => { start = null; });
  pane.addEventListener('touchend', event => {
    const origin = start;
    start = null;
    if (!origin || event.touches.length || !event.changedTouches.length || window.getSelection()?.toString()) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const selected = activeButton();
    if (!selected) return;
    const next = dx < 0 ? selected.nextElementSibling || rail.firstElementChild
                        : selected.previousElementSibling || rail.lastElementChild;
    if (event.cancelable) event.preventDefault();
    next.click();
  }, { passive: false });
})();

(() => {
  'use strict';
  const feed = document.getElementById('cols');
  const filters = document.getElementById('filters');
  const date = document.getElementById('m-date');
  const payload = document.getElementById('payload');
  if (!feed || !filters || !date || !payload) return;

  const order = ['ai-news', 'new-ideas', 'invest', 'startup-news', 'daily-trends',
    'life-hacks', 'ai-tools', 'go-global', 'immigration'];
  const rank = slug => slug === 'all' ? -1 : (order.includes(slug) ? order.indexOf(slug) : order.length);
  const { issues, bots } = JSON.parse(payload.textContent);
  const weekly = new Set(bots.filter(bot => bot.weekly).map(bot => bot.slug));
  const latest = (slug, day) => issues.filter(issue => issue.slug === slug &&
    (weekly.has(slug) ? issue.date <= day : issue.date === day))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  function sortChildren(parent) {
    const children = Array.from(parent.children);
    children.sort((a, b) => rank(a.dataset.slug) - rank(b.dataset.slug));
    parent.append(...children);
  }
  sortChildren(filters);
  const today = document.querySelector('#rel-row button[data-date]')?.dataset.date;
  if (today && !new URLSearchParams(location.search).get('date') && date.value !== today) {
    date.value = today;
    date.dispatchEvent(new Event('change'));
  }
  const intro = document.querySelector('.top .sub');
  if (intro) intro.textContent = '公开版 · 点标题读摘要，点来源看原文 · 北京时间';
  const shortcuts = document.createElement('div');
  shortcuts.className = 'weekly-shortcuts';
  const phone = matchMedia('(max-width: 700px)');
  function placeShortcuts() {
    if (phone.matches) feed.before(shortcuts);
    else filters.before(shortcuts);
  }
  placeShortcuts();
  phone.addEventListener('change', placeShortcuts);
  const css = document.createElement('style');
  css.textContent = `
    .weekly-shortcuts:empty {display:none}
    .weekly-shortcuts {display:flex;flex-wrap:wrap;gap:4px 12px;margin:4px 0}
    .weekly-shortcuts button,.column-more {color:var(--green);background:none;border:0;font:inherit;font-size:.875rem;cursor:pointer}
    .weekly-shortcuts button {text-decoration:underline;text-underline-offset:3px;padding:6px 0}
    .col-h .name {display:flex;align-items:baseline;gap:.55em}
    .col-h small {font-size:.85rem;font-weight:500}
    .col .column-more {display:block;padding:10px 12px;min-height:44px;font-weight:600}
    .col .brief-state {margin-left:auto;font-size:.875rem;font-weight:500}
    .col .brief-title {display:block;position:relative;padding-right:1.2em;cursor:pointer;list-style:none;overflow-wrap:anywhere}
    .brief-title::-webkit-details-marker {display:none}
    .brief-title::after {content:"";position:absolute;right:3px;top:.45em;width:7px;height:7px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}
    details[open]>.brief-title::after {transform:rotate(225deg);top:.65em}
    .brief-detail .sum {display:block;white-space:pre-line;overflow:visible;font-size:1rem;line-height:1.65;margin-top:.55em}
    .item .src {font-size:.875rem;line-height:1.5;margin-top:4px;overflow-wrap:anywhere}
    .item .src a {color:var(--green);text-decoration:underline;text-underline-offset:3px;display:inline-block;padding:3px 0}
    .cols {align-items:start}
    @media(max-width:700px) {
      .col .column-more {padding-left:0}
      .col-h {min-height:36px}
      .item .brief-title {font-size:1.07rem;line-height:1.45}
    }
    .top h1, .wrap .mobile-masthead {
      font-family: Georgia, 'Times New Roman', serif; letter-spacing: -.045em;
      line-height: 1.05; font-weight: 700; color:var(--ink);
    }
    header.top { border:0; padding:18px 0 12px; }
    header.top h1 { font-size:2.35rem; }
    .wrap .toolbar { background:var(--bg); opacity:1; filter:none; -webkit-backdrop-filter:none; backdrop-filter:none; }
    .col { background:var(--bg); border:1px solid var(--line); border-radius:0; }
    .col .col-h { background:var(--bg); color:var(--ink); border:0; border-bottom:1px solid var(--line); }
    .col-h .badge { background:transparent; color:var(--muted); }
    .col-h small { color:var(--muted); }
    .col .brief-title { color:var(--ink); font-weight:600; }
    .item .src, .item .src b, .item .src a { color:var(--muted); font-weight:400; }
    .item .src a { text-decoration-color:var(--rule); }
    .status, .corr, .chip, .chip.also { background:var(--chip); color:var(--ink); }
    .status, .corr { border-left-color:var(--rule); }
    .xline.new, .brief-detail .sum { color:var(--ink); }
    .col .column-more, .weekly-shortcuts button { color:var(--ink); }
    .col .column-more { text-decoration:underline; text-underline-offset:3px; text-decoration-color:var(--rule); }
    @media (max-width:700px) {
      .wrap .toolbar { padding-inline:16px; border-bottom:1px solid var(--line); }
      .wrap .m-bar { min-height:47px; }
      .wrap .m-bar select { font-size:16px; width:auto; max-width:48vw; border:0; box-shadow:none; background:var(--bg); color:var(--ink); }
      .toolbar .filters { gap:18px; margin:0; border:0; }
      .toolbar .filters button { color:var(--muted); font-size:15px; }
      .toolbar .filters button[aria-pressed="true"] { color:var(--accent); box-shadow:inset 0 -3px var(--accent); }
      .reading-pane { background:var(--bg); padding-inline:16px; }
      .cols { margin-top:0; }
      .col { margin:24px 0 0; border:0; }
      .col .col-h { padding:0 0 8px; min-height:36px; border-bottom:1px solid var(--rule); }
      .col-h .name { font-size:1.05rem; font-weight:700; }
      .col-h .badge { padding-right:0; font-size:.78rem; }
      .item .src { font-size:.86rem; }
      .col .item { padding:13px 0; }
      .col .column-more, .col .foot, .col .empty { padding-inline:0; }
      .col .brief-title { line-height:1.5; }
      .status, .corr { margin:8px 0; }
      .wrap .toolbar :focus-visible { outline:2px solid var(--accent); }
    }
  `;
  document.head.append(css);

  function openColumn(slug, focusHeading) {
    const button = filters.querySelector('button[data-slug="' + CSS.escape(slug) + '"]');
    if (!button) return;
    button.click();
    if (focusHeading) requestAnimationFrame(() => {
      const heading = feed.querySelector('.col-h');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
        if (!phone.matches) heading.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  function action(text, className, slug) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', () => openColumn(slug, true));
    return button;
  }

  function formatArticle(article) {
    const title = article.querySelector('.title');
    if (!title) return;
    let source = article.querySelector('.src');
    const original = title.getAttribute('href');
    if (original && !Array.from(source?.querySelectorAll('a') || []).some(a => a.href === title.href)) {
      if (!source) {
        source = document.createElement('div');
        source.className = 'xline src';
        article.append(source);
      }
      const link = title.cloneNode(false);
      link.removeAttribute('class');
      link.textContent = '原文';
      source.append(source.textContent ? ' · ' : '', link);
    }
    article.querySelector('.sum-tg')?.remove();
    const details = document.createElement('details');
    details.className = 'brief-detail';
    const summary = document.createElement('summary');
    summary.className = 'title brief-title';
    summary.textContent = title.textContent;
    title.replaceWith(details);
    details.append(summary);
    for (const child of Array.from(article.children)) {
      if (child !== details && child !== source) details.append(child);
    }
  }

  const pane = feed.closest('.reading-pane');
  const storageKey = 'brief-reading-v1';
  const visitDay = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
  let positions = {};
  let viewKey = '';
  let saveTimer;
  function readPositions() {
    try {
      const record = JSON.parse(localStorage.getItem(storageKey));
      return record?.day === visitDay ? record.views || {} : {};
    } catch { return {}; }
  }
  positions = readPositions();

  function itemKey(item) {
    return item.closest('.col').dataset.slug + '/' +
      (item.dataset.key || item.querySelector('summary')?.textContent || '');
  }
  function savePosition() {
    clearTimeout(saveTimer);
    if (!phone.matches || !pane || !viewKey) return;
    const items = [...feed.querySelectorAll('.item')];
    const top = pane.getBoundingClientRect().top;
    const anchor = items.find(item => item.getBoundingClientRect().bottom > top);
    const mark = {
      y: pane.scrollTop,
      anchor: anchor ? itemKey(anchor) : '',
      offset: anchor ? anchor.getBoundingClientRect().top - top : 0,
      open: items.filter(item => item.querySelector('details[open]')).map(itemKey)
    };
    positions[viewKey] = mark;
    try {
      positions = { ...positions, ...readPositions(), [viewKey]: mark };
      localStorage.setItem(storageKey, JSON.stringify({ day: visitDay, views: positions }));
    } catch { /* This tab retains positions when storage is unavailable. */ }
  }
  function restorePosition() {
    if (!phone.matches || !pane) return;
    viewKey = date.value + '/' + filters.querySelector('[aria-pressed="true"]').dataset.slug;
    const mark = positions[viewKey];
    if (!mark) { pane.scrollTop = 0; return; }
    const items = [...feed.querySelectorAll('.item')];
    const opened = new Set(mark.open);
    for (const item of items) {
      const detail = item.querySelector('details');
      if (detail) detail.open = opened.has(itemKey(item));
    }
    const anchor = items.find(item => itemKey(item) === mark.anchor);
    pane.scrollTop = anchor && mark.y > 0
      ? pane.scrollTop + anchor.getBoundingClientRect().top - pane.getBoundingClientRect().top - mark.offset
      : mark.y;
  }
  filters.addEventListener('click', savePosition, true);
  date.addEventListener('change', savePosition, true);
  pane?.addEventListener('scroll', () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(savePosition, 180);
  }, { passive: true });
  window.addEventListener('pagehide', savePosition);
  document.addEventListener('visibilitychange', () => { if (document.hidden) savePosition(); });

  function render() {
    observer.disconnect();
    const all = filters.querySelector('[aria-pressed="true"]')?.dataset.slug === 'all';
    sortChildren(feed);
    shortcuts.replaceChildren();
    for (const col of feed.children) {
      const slug = col.dataset.slug;
      const head = col.querySelector('.col-h');
      const name = head.firstElementChild;
      const count = Number(filters.querySelector('[data-slug="' + CSS.escape(slug) + '"]').dataset.count);
      const issue = latest(slug, date.value);
      const isWeekly = weekly.has(slug);
      const articles = Array.from(col.querySelectorAll('.item'));
      const text = document.createElement('small');
      text.textContent = count + ' 条';
      const label = name.textContent;
      name.className = 'name';
      if (count) name.append(text);
      if (all && isWeekly && issue?.date === date.value) {
        shortcuts.append(action(label + ' 已更新 · ' + count + ' 条', '', slug));
      }
      if (all && (count === 0 || (isWeekly && issue?.date !== date.value))) {
        const state = document.createElement('span');
        state.className = 'brief-state';
        if (!issue) state.textContent = '待更新';
        else if (isWeekly && issue.date !== date.value) state.textContent = '最近一期 ' + issue.date.slice(5);
        else if (issue.status && /失败|未能|受限|读不到|不完整|未完成|部分|无法|超时|failed|partial|unavailable/i.test(issue.status)) state.textContent = '采集受限';
        else if (!issue.status) state.textContent = '本期 0 条 · 状态未说明';
        else state.textContent = '本期无新增';
        const link = action(state.textContent, 'column-state', slug);
        link.style.cssText = 'font:inherit;color:inherit;background:none;border:0;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:6px 0';
        state.replaceChildren(link);
        head.lastElementChild.replaceWith(state);
        col.replaceChildren(head);
        continue;
      }
      if (!issue && !all) col.querySelector('.state-missing').textContent = '待更新';
      const limit = all ? (order.slice(0, 2).includes(slug) ? 3 : 1) : articles.length;
      articles.forEach((item, index) => {
        if (index < limit) formatArticle(item);
        else item.remove();
      });
      if (all && count) {
        col.querySelector('.status')?.remove();
        col.querySelector('.foot')?.remove();
        col.append(action('查看全部 ' + count + ' 条', 'column-more', slug));
      }
    }
    restorePosition();
    observer.observe(feed, { childList: true });
  }
  const observer = new MutationObserver(render);
  render();
})();




