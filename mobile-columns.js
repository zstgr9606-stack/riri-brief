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
  const masthead = wrap.querySelector('header.top');
  const desktopDate = document.getElementById('date-select');
  desktopDate.closest('.row').hidden = true;
  const mobileDate = document.getElementById('m-date');
  const relativeDays = new Map(Array.from(document.querySelectorAll('#rel-row button[data-date]'),
    (button, i) => [button.dataset.date, ['Today', 'Yesterday', 'Day Before Yesterday'][i]]));
  const formatDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  });
  const currentYear = document.querySelector('#rel-row button[data-date]')?.dataset.date.slice(0, 4);
  const shortDate = new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
  for (const picker of [desktopDate, mobileDate]) {
    for (const option of picker.options) {
      const sameYearOnPhone = picker === mobileDate && option.value.slice(0, 4) === currentYear;
      const calendarDate = (sameYearOnPhone ? shortDate : formatDate).format(new Date(option.value + 'T00:00:00Z'));
      const relative = relativeDays.get(option.value);
      const noIssue = option.textContent.includes('无刊');
      option.dataset.calendarDate = calendarDate;
      option.dataset.relative = relative || '';
      option.textContent = [calendarDate, relative, noIssue ? 'No issue' : ''].filter(Boolean).join(' · ');
    }
  }
  const caption = document.createElement('span');
  caption.className = 'edition-caption';
  caption.setAttribute('aria-hidden', 'true');
  const calendar = document.createElement('span');
  const relative = document.createElement('small');
  caption.append(calendar, relative);
  mobileDate.before(caption);
  function syncCaption() {
    const selected = mobileDate.selectedOptions[0];
    calendar.textContent = selected?.dataset.calendarDate || '';
    relative.textContent = selected?.dataset.relative || '';
  }
  syncCaption();
  new MutationObserver(syncCaption).observe(content, {childList:true});
  const editionNav = document.createElement('div');
  editionNav.className = 'edition-nav';
  const picker = document.createElement('span');
  picker.className = 'edition-picker';
  const icon = document.createElement('span');
  icon.className = 'edition-calendar';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15.5" rx="2.6"/><path d="M7.5 3v5M16.5 3v5M4 10.5h16"/></svg>';
  caption.prepend(icon.cloneNode(true));
  picker.append(icon, desktopDate);
  const previous = document.getElementById('prev-date');
  const next = document.getElementById('next-date');
  for (const button of [previous, next]) {
    const path = button === previous ? 'M10 3.5 6 8l4 4.5' : 'M6 3.5 10 8l-4 4.5';
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="' + path +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  editionNav.append(previous, picker, next);
  masthead.append(editionNav);
  const title = masthead.querySelector('h1').cloneNode(true);
  title.className = 'mobile-masthead';
  dateBar.prepend(title);
  const style = document.createElement('style');
  style.textContent = `
    .reading-pane { display: contents; }
    .mobile-masthead { display: none; }
    .edition-calendar { display:inline-flex; align-items:center; color:var(--muted); pointer-events:none; }
    .edition-calendar svg { display:block; width:16px; height:16px; }
    .toolbar .row[hidden] { display: none; }
    @media (min-width: 701px) {
      .wrap > header.top { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
      .edition-nav { display:flex; align-items:center; gap:7px; }
      .edition-picker { position:relative; display:flex; align-items:center; border-radius:5px; }
      .edition-picker .edition-calendar { position:absolute; left:7px; }
      header.top #date-select { appearance:none; -webkit-appearance:none; field-sizing:content; min-width:0; height:36px;
        padding:0 6px 0 30px; background:transparent; color:var(--ink); border:0; cursor:pointer; font-variant-numeric:tabular-nums; }
      .edition-nav .nav-btn { display:grid; place-items:center; box-sizing:border-box; width:32px; height:32px;
        min-width:32px; padding:0; border:0; border-radius:50%; background:#214d64; color:white; cursor:pointer; }
      .edition-nav .nav-btn svg { display:block; }
      .edition-nav .nav-btn:enabled:hover { background:#163a50; }
      .edition-nav .nav-btn:disabled { background:#80939e; opacity:1; cursor:default; }
      .edition-picker:hover { background:var(--chip); }
      .edition-nav :focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
      .wrap > header.top .sub, .toolbar #rel-row { display: none; }
    }
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

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hint = document.createElement('div');
  hint.className = 'swipe-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.hidden = true;
  wrap.append(hint);
  let start = null;
  let motion = null;
  let outgoing = null;

  function stopMotion() {
    motion?.cancel();
    motion = null;
    outgoing?.remove();
    outgoing = null;
  }

  function clearDrag() {
    start = null;
    hint.hidden = true;
    content.style.removeProperty('transform');
  }

  function neighbor(dx) {
    const current = activeButton();
    if (!current) return null;
    return dx > 0 ? current.previousElementSibling || rail.lastElementChild
                  : current.nextElementSibling || rail.firstElementChild;
  }

  function snapBack() {
    const dx = start?.offset || 0;
    clearDrag();
    if (dx && !reduceMotion.matches) {
      motion = content.animate([{transform:'translateX(' + dx + 'px)'}, {transform:'none'}],
        {duration:150, easing:'ease-out'});
    }
  }

  pane.addEventListener('touchstart', event => {
    stopMotion();
    clearDrag();
    if (!mobile.matches || event.touches.length !== 1 || window.getSelection()?.toString()) return;
    const t = event.touches[0];
    const width = pane.clientWidth;
    if (t.clientX < 22 || t.clientX > width - 22) return;
    start = {x:t.clientX, y:t.clientY, width, offset:0, horizontal:false};
  }, {passive:true});

  pane.addEventListener('touchmove', event => {
    if (!start) return;
    if (event.touches.length !== 1 || window.getSelection()?.toString()) { snapBack(); return; }
    const t = event.touches[0];
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (!start.horizontal) {
      if (Math.abs(dy) > 9 && Math.abs(dy) >= Math.abs(dx)) { clearDrag(); return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      start.horizontal = true;
    }
    if (event.cancelable) event.preventDefault();
    if (reduceMotion.matches) return;
    start.offset = Math.sign(dx) * Math.min(Math.abs(dx), start.width * .78);
    content.style.transform = 'translateX(' + start.offset + 'px)';
    const next = neighbor(dx);
    if (!next) return;
    hint.dataset.slug = next.dataset.slug;
    hint.textContent = next.textContent;
    hint.classList.toggle('from-right', dx < 0);
    hint.style.top = Math.min(pane.getBoundingClientRect().bottom - 36,
      Math.max(pane.getBoundingClientRect().top + 12, start.y - 16)) + 'px';
    hint.style.width = Math.max(0, Math.abs(start.offset) - 6) + 'px';
    hint.hidden = Math.abs(dx) < 28;
  }, {passive:false});

  pane.addEventListener('touchcancel', snapBack);
  pane.addEventListener('touchend', event => {
    if (!start) return;
    if (event.touches.length || !event.changedTouches.length || window.getSelection()?.toString()) {
      snapBack(); return;
    }
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x, dy = t.clientY - start.y;
    const next = neighbor(dx);
    if (!next || Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) { snapBack(); return; }
    if (event.cancelable) event.preventDefault();
    const {offset, width} = start;
    clearDrag();
    if (reduceMotion.matches) { next.click(); return; }

    // Keep the outgoing viewport at its reading position while the live column takes over.
    const rect = pane.getBoundingClientRect();
    const old = pane.cloneNode(true);
    old.classList.add('swipe-outgoing');
    old.inert = true;
    old.setAttribute('aria-hidden','true');
    old.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    Object.assign(old.style, {top:rect.top+'px', left:rect.left+'px', width:rect.width+'px',
      height:rect.height+'px'});
    wrap.append(old);
    outgoing = old;
    old.scrollTop = pane.scrollTop;
    next.click();
    const end = Math.sign(dx) * width;
    const timing = {duration:215, easing:'cubic-bezier(.22,.72,.24,1)'};
    const slide = (el, from, to) => el.animate(
      [{transform:'translateX(' + from + 'px)'}, {transform:'translateX(' + to + 'px)'}], timing);
    const exit = slide(old, offset, end);
    motion = slide(pane, offset - end, 0);
    exit.onfinish = () => { old.remove(); if (outgoing === old) outgoing = null; };
  }, {passive:false});

  mobile.addEventListener('change', () => { stopMotion(); clearDrag(); });

})();

(() => {
  'use strict';
  const feed = document.getElementById('cols');
  const filters = document.getElementById('filters');
  const date = document.getElementById('m-date');
  const payload = document.getElementById('payload');
  if (!feed || !filters || !date || !payload) return;

  const order = ['ai-news', 'ai-tools', 'creator-watch', 'new-ideas', 'startup-news',
    'go-global', 'invest', 'daily-trends', 'life-hacks', 'immigration'];
  const rank = slug => slug === 'all' ? -1 : (order.includes(slug) ? order.indexOf(slug) : order.length);
  const { issues, bots } = JSON.parse(payload.textContent);
  const columnNames = new Map(bots.map(bot => [bot.slug, bot.column]));
  columnNames.set('all', '全部');
  const weekly = new Set(bots.filter(bot => bot.weekly).map(bot => bot.slug));
  const cadence = new Map(bots.filter(bot => bot.cadence).map(bot => [bot.slug, bot]));
  function scheduleOn(slug, day) {
    const bot = cadence.get(slug);
    return bot && day >= bot.cadenceFrom ? bot.cadence : '';
  }
  const latest = (slug, day) => issues.filter(issue => issue.slug === slug &&
    ((weekly.has(slug) || scheduleOn(slug, day)) ? issue.date <= day : issue.date === day))
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
  const phone = matchMedia('(max-width: 700px)');
  const mobileLabels = new Map([
    ['startup-news', 'Startups'],
    ['daily-trends', 'Trends'],
    ['ai-tools', 'Products'],
    ['creator-watch', 'Creators']
  ]);
  function updateFilterLabels() {
    for (const button of filters.querySelectorAll('button[data-slug]')) {
      const slug = button.dataset.slug;
      const fullName = columnNames.get(slug);
      if (fullName) button.textContent = (phone.matches && mobileLabels.get(slug)) || fullName;
    }
  }
  phone.addEventListener('change', updateFilterLabels);
  const css = document.createElement('style');
  css.textContent = `
    .wrap #filters {
      --tab-blue:#214c63;
      display:flex; flex-wrap:nowrap; gap:0; align-items:stretch;
      overflow-x:auto; background:var(--tab-blue); padding:4px 0 0;
      border:0; box-sizing:border-box; overscroll-behavior-x:contain;
    }
    .wrap #filters button[data-slug] {
      flex:1 0 auto; min-height:44px; padding:0 12px; margin:0; border:0;
      border-radius:0; background:transparent; color:white; box-shadow:none;
      font-weight:600; text-align:center; white-space:nowrap;
    }
    .wrap #filters button[data-slug][aria-pressed=true] {
      color:var(--tab-blue); background:white; border-radius:8px 8px 0 0; font-weight:700; box-shadow:none;
    }
    .wrap #filters button:focus-visible {outline:2px solid currentColor;outline-offset:-4px}
    .swipe-hint {display:none}
    @media(max-width:700px) {
      .col .col-h {column-gap:5px}
      .col .col-h h2.name {font-size:clamp(1.25rem,5.65vw,1.55rem)}
      .col .col-h .badge {padding-inline:0;white-space:nowrap;flex-shrink:0;font-size:.73rem}
      .wrap #filters {
        display:grid; grid-auto-flow:column; grid-auto-columns:max(25%,92px);
        width:calc(100% + 32px); max-width:none; margin:0 -16px; scrollbar-width:none;
      }
      .wrap #filters button[data-slug] {font-size:15px;min-width:0;padding:0 2px}
      .reading-pane {overflow-x:hidden}
      .swipe-outgoing {position:fixed;z-index:4;pointer-events:none;box-sizing:border-box;overflow:hidden}
      .swipe-hint:not([hidden]) {display:block;position:fixed;left:0;z-index:2;pointer-events:none;
        overflow:hidden;white-space:nowrap;padding:5px 0;text-indent:10px;
        font-weight:600;font-size:.875rem;color:var(--ink)}
      .swipe-hint.from-right {left:auto;right:0;text-align:right;text-indent:0;padding-right:8px;box-sizing:border-box}
    }
    .column-more {color:var(--ink);background:none;border:0;font:inherit;font-size:.875rem;cursor:pointer}
    .col-h .name {
      margin:0; color:var(--accent); font-family:Georgia,'Times New Roman',serif;
      font-size:clamp(1.55rem,2.8vw,1.85rem); font-weight:700;
      line-height:1.12; letter-spacing:-.035em; overflow-wrap:break-word;
    }
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
    @media (min-width:701px) {
      body > .wrap { box-sizing:border-box; width:100%; max-width:none; margin-inline:0; padding-inline:clamp(16px,1.5vw,32px); }
      .wrap #cols { align-items:stretch; }
      .wrap #cols > .col { box-sizing:border-box; width:100%; min-width:0; align-self:start; }
      .wrap #cols > .col:only-child { grid-column:1 / -1; }
      .col:only-child .brief-detail .sum { max-width:80ch; }
    }
    @media (min-width:900px) {
      .wrap #cols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (min-width:1500px) {
      .wrap #cols { grid-template-columns:repeat(auto-fit,minmax(450px,1fr)); }
    }
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
    .col .brief-title { color:var(--ink); font-weight:600; }
    .item .src, .item .src b, .item .src a { color:var(--muted); font-weight:400; }
    .item .src a { text-decoration-color:var(--rule); }
    .status, .corr, .chip, .chip.also { background:var(--chip); color:var(--ink); }
    .status, .corr { border-left-color:var(--rule); }
    .xline.new, .brief-detail .sum { color:var(--ink); }
    .col .column-more { text-decoration:underline; text-underline-offset:3px; text-decoration-color:var(--rule); }
    @media (max-width:700px) {
      .wrap .toolbar { padding-inline:16px; border-bottom:0; }
      .wrap .m-bar { min-height:47px; }
      .wrap .m-bar label:has(#m-date) { position:relative; display:grid; align-content:center; min-height:44px; }
      .edition-caption { display:grid; position:relative; padding-inline-start:20px; text-align:right;
        color:var(--ink); font-size:14px; font-weight:600; line-height:1.3; }
      .edition-caption small { font-size:12px; font-weight:500; color:var(--muted); }
      .edition-caption small:empty { display:none; }
      .edition-caption .edition-calendar { position:absolute; left:0; top:0.12em; }
      .edition-caption .edition-calendar svg {width:14px; height:14px;}
      .wrap .m-bar #m-date { position:absolute; inset:0; opacity:0; width:100%; height:100%; max-width:none; }
      .m-bar label:has(#m-date:focus-visible) { outline:2px solid var(--accent); outline-offset:2px; }
      @media (max-width:360px) { .wrap .toolbar .mobile-masthead {font-size:1.15rem} }
      .wrap .m-bar select { font-size:16px; width:auto; max-width:48vw; border:0; box-shadow:none; background:var(--bg); color:var(--ink); }
      .toolbar .filters { gap:18px; margin:0; border:0; }
      .toolbar .filters button { color:var(--muted); font-size:15px; }
      .toolbar .filters button[aria-pressed="true"] { color:var(--accent); box-shadow:inset 0 -3px var(--accent); }
      .reading-pane { background:var(--bg); padding-inline:16px; }
      .cols { margin-top:0; }
      .col { margin:24px 0 0; border:0; }
      .col .col-h { padding:0 0 8px; min-height:36px; border:0; }
      .col-h .name { font-size:clamp(1.55rem,6.4vw,1.75rem); }
      .col-h .badge { padding-right:0; font-size:.78rem; }
      .wrap .mobile-masthead {letter-spacing:-.015em;text-shadow:none}
      .item .src { font-size:.86rem; }
      .col .item { padding:14px 0; border:0; }
      .col .column-more, .col .foot, .col .empty { padding-inline:0; border:0; }
      .col .brief-title { line-height:1.5; }
      .status, .corr { margin:8px 0; }
      .wrap .toolbar :focus-visible { outline:2px solid var(--accent); }
    }
    .col .item.is-read .brief-detail:not([open]) > .brief-title {font-weight:500;color:#586b74}
    .source-bar {display:flex;align-items:baseline;gap:0 12px;flex-wrap:wrap;margin-top:4px;color:var(--muted);font-size:.86rem}
    .source-bar .primary-source {max-width:100%;overflow-wrap:anywhere;color:inherit;text-decoration:none;padding:4px 0}
    .source-bar button,.share-story {font:inherit;font-size:.86rem;color:var(--muted);background:none;border:0;cursor:pointer;padding:4px 0}
    .share-story {display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;
      vertical-align:middle;text-decoration:none;border-radius:8px}
    .share-story:hover,.share-story:focus-visible {color:var(--accent);background:var(--chip)}
    .share-story svg {width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
    .product-picks {margin:20px 0 4px}
    .product-picks h3 {
      display:flex;align-items:center;gap:8px;margin:0 12px 4px;
      font-size:1.1rem;font-weight:600;line-height:1.4;color:var(--accent);
    }
    .product-picks h3::before {content:"";width:3px;height:1em;border-radius:2px;background:currentColor}
    .product-picks .review-credit {font-size:.8125rem;color:var(--muted);line-height:1.5}
    @media(max-width:700px){.product-picks h3{margin-inline:0}}
    .share-feedback {font-size:.86rem;color:var(--muted)}
    .source-bar .primary-source:hover,.source-bar .primary-source:focus-visible {text-decoration:underline}
    .brief-detail .sum p {margin:0}
    .brief-detail .sum p + p {margin-top:.65em}
    .source-bar {align-items:center;gap:0 6px}
    .source-bar .source-citation, .brief-detail[open] + .source-bar .source-short {display:none}
    .brief-detail[open] + .source-bar .source-citation {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .source-bar .primary-source {flex:0 1 auto;min-width:0;max-width:calc(100% - 95px)}
    .source-bar .more-sources {min-width:32px;min-height:32px;font-variant-numeric:tabular-nums}
    .source-bar .share-controls {display:none;margin-left:auto}
    .brief-detail[open] + .source-bar .share-controls {display:flex;align-items:center}
    .item .source-list[hidden], .col .status[hidden] {display:none}
    .item .source-list {margin:4px 0 0;padding-left:1.1em;color:var(--muted)}
    .item .source-list li {margin:.15em 0;overflow-wrap:anywhere}
    .col-h .badge {margin-left:auto}
    .col-h .info-toggle {font:inherit;font-size:1rem;color:var(--muted);border:0;background:none;
      padding:0;min-width:32px;min-height:36px;cursor:pointer}
    .col-h .info-toggle[aria-expanded=true] {color:var(--accent)}
    .share-address {width:100%;font:inherit}
    .collection-status,.correction-note {margin:0;padding:0;color:var(--muted);font-size:.86rem}
    .collection-status summary,.correction-note summary {cursor:pointer;padding:8px 10px}
    .correction-note .corr {line-height:1.6;background:transparent;border:0;padding:4px 10px;margin:0}
    .correction-note .corr:last-child {padding-bottom:10px}
    .collection-status .status {margin:0 6px 6px;line-height:1.55}
    .item[id] {scroll-margin-top:10rem}
    @media(max-width:700px) {.item[id]{scroll-margin-top:8px}.collection-status summary,.correction-note summary,.correction-note .corr{padding-inline:0}}
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

  function shortSource(anchor) {
    const parts = [...new Set(anchor.textContent.split(' · ').map(s => s.trim())
      .filter(s => s && !/^\d{4}-\d{2}-\d{2}/.test(s)))];
    return parts[0] || anchor.hostname;
  }

  function compactSources(article, full, title, controls) {
    const entries = full ? [...full.querySelectorAll('a, span')] : [];
    const sameUrl = entries.find(node => node.href && node.href === title.href);
    const main = title.href ? sameUrl || title : entries.find(node => node.href);
    const useHostname = main === title && !sameUrl;
    const bar = document.createElement('div');
    bar.className = 'source-bar';
    const sources = new Map();
    for (const entry of entries) {
      const key = entry.href || entry.textContent;
      if (key && !sources.has(key)) sources.set(key, entry);
    }
    if (!main && full) {
      article.append(bar);
      bar.append(controls);
      return;
    }
    if (main) {
      const primary = main.cloneNode(false);
      const name = useHostname ? main.hostname.replace(/^www\./, '') : shortSource(main);
      primary.className = 'primary-source';
      primary.title = useHostname ? main.hostname : main.textContent;
      const short = document.createElement('span');
      short.className = 'source-short';
      short.textContent = name + ' ↗';
      const citation = document.createElement('span');
      citation.className = 'source-citation';
      citation.textContent = primary.title + ' ↗';
      primary.append(short, citation);
      primary.setAttribute('aria-label', '打开原文：' + primary.title);
      bar.append(primary);
      sources.delete(main.href);
    }
    bar.append(controls);
    article.append(bar);
    if (!sources.size) {
      full?.remove();
      return;
    }
    const list = document.createElement('ul');
    list.id = article.id + '-sources';
    list.className = 'src source-list';
    list.hidden = true;
    for (const source of sources.values()) {
      const row = document.createElement('li');
      row.append(source);
      list.append(row);
    }
    full?.remove();
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'more-sources';
    more.textContent = '+' + sources.size;
    more.setAttribute('aria-label', '另有 ' + sources.size + ' 个来源');
    more.setAttribute('aria-controls', list.id);
    more.setAttribute('aria-expanded', 'false');
    more.addEventListener('click', () => {
      list.hidden = !list.hidden;
      more.setAttribute('aria-expanded', String(!list.hidden));
    });
    controls.before(more);
    article.append(list);
  }

  // Use the stable article URL where available, so edits to headlines preserve shared links.
  function shareId(key) {
    let value = 14695981039346656037n;
    for (const character of key) {
      value = BigInt.asUintN(64, (value ^ BigInt(character.codePointAt(0))) * 1099511628211n);
    }
    return value.toString(36);
  }

  function shareLink(article, headline, slug) {
    const key = article.dataset.key || headline;
    const id = shareId(key);
    article.id = 'story-' + slug + '-' + id;
    const url = new URL(location.pathname, location.origin);
    url.search = new URLSearchParams({date: date.value, col: slug, story: id});
    const link = document.createElement('a');
    link.className = 'share-story';
    link.href = url.href;
    link.setAttribute('aria-label', '分享这条');
    link.title = '分享这条';
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 15V3m-4 4 4-4 4 4M7.5 10H5v11h14V10h-2.5"/></svg>';
    const feedback = document.createElement('span');
    feedback.className = 'share-feedback';
    feedback.setAttribute('role', 'status');
    let feedbackTimer;
    link.addEventListener('click', async event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (navigator.share) {
        try { await navigator.share({title: headline, url: url.href}); return; }
        catch (error) { if (error.name === 'AbortError') return; }
      }
      try {
        await navigator.clipboard.writeText(url.href);
        feedback.textContent = '链接已复制';
        clearTimeout(feedbackTimer);
        feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 2200);
      } catch {
        let field = article.querySelector('.share-address');
        if (!field) {
          field = document.createElement('input');
          field.className = 'share-address';
          field.readOnly = true;
          field.setAttribute('aria-label', '复制本条简报链接');
          field.value = url.href;
          link.after(field);
        }
        field.focus();
        field.select();
      }
    });
    const controls = document.createElement('div');
    controls.className = 'share-controls';
    controls.append(feedback, link);
    return controls;
  }

  // Store each mark separately so another tab cannot overwrite a reader's progress.
  const readPrefix = 'shaoyao-read-v1/';
  const sessionRead = new Set();
  function markRead(article) {
    const key = article?.dataset.readKey;
    if (!key || article.classList.contains('is-read')) return;
    sessionRead.add(key);
    article.classList.add('is-read');
    try { localStorage.setItem(key, '1'); } catch { /* Keep the in-memory mark. */ }
  }
  function refreshRead(article) {
    const key = article.dataset.readKey;
    let read = sessionRead.has(key);
    try { read ||= localStorage.getItem(key) === '1'; } catch { /* Storage is optional. */ }
    article.classList.toggle('is-read', read);
  }
  window.addEventListener('storage', event => {
    if (!event.key || event.key.startsWith(readPrefix)) {
      if (!event.key) sessionRead.clear();
      for (const article of feed.querySelectorAll('.item[data-read-key]')) refreshRead(article);
    }
  });
  function recordInteraction(event) {
    const target = event.target.closest('a.primary-source[href], .src a[href]');
    if (!target || event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
    markRead(target.closest('.item'));
  }
  feed.addEventListener('click', recordInteraction);
  feed.addEventListener('auxclick', recordInteraction);

  // Preserve the original wording, dates, and qualifications when laying out old issues.
  function formatSummary(node, product) {
    if (!node || node.children.length) return;
    const paragraphs = [];
    const evidence = /^(?:[^。；]{0,16}(?:统计页|数据显示|截至|累计|榜单|下载|付费|收入|星标|票数)|Show HN|Product Hunt)/i;
    for (const line of node.textContent.trim().split(/\n+/)) {
      let paragraph = '';
      for (const sentence of line.match(/[^。！？]+[。！？]*|[。！？]+/gu) || []) {
        if (paragraph && (paragraph.length >= 95 ||
            (line.length > 105 && paragraph.length >= line.length / 3 && paragraph.length + sentence.length > 100) ||
            (product && paragraph.length >= 22 && evidence.test(sentence.trim())))) {
          paragraphs.push(paragraph);
          paragraph = '';
        }
        paragraph += sentence;
      }
      if (paragraph) paragraphs.push(paragraph);
    }
    node.replaceChildren(...paragraphs.map(text => {
      const p = document.createElement('p');
      p.textContent = text;
      if (product) {
        const metric = /(?:访问|下载|付费用户|活跃用户|注册用户|收入)\s*[约近超]?\s*[¥￥$€]?\s*\d[\d,.]*(?:万|千|亿)?\s*(?:次|名|人|美元|元|欧元)/gu;
        let end = 0;
        const parts = [];
        for (const match of text.matchAll(metric)) {
          const strong = document.createElement('strong');
          strong.textContent = match[0];
          parts.push(text.slice(end, match.index), strong);
          end = match.index + match[0].length;
        }
        if (parts.length) p.replaceChildren(...parts, text.slice(end));
      }
      return p;
    }));
  }

  function formatArticle(article, slug, issueDate, item) {
    const title = article.querySelector('.title');
    if (!title) return;
    article.dataset.readKey = readPrefix + issueDate + '/' + shareId(article.dataset.key || slug + '/' + title.textContent);
    refreshRead(article);
    const full = article.querySelector('.src');
    formatSummary(article.querySelector('.sum'), slug === 'ai-tools');
    article.querySelector('.sum-tg')?.remove();
    const details = document.createElement('details');
    details.className = 'brief-detail';
    details.addEventListener('toggle', () => { if (details.open) markRead(article); });
    const summary = document.createElement('summary');
    summary.className = 'title brief-title';
    summary.textContent = title.textContent;
    title.replaceWith(details);
    details.append(summary);
    for (const child of [...article.children]) {
      if (child !== details) details.append(child);
    }
    const controls = shareLink(article, summary.textContent, slug);
    const review = item?.reviewUrl && [...(full?.querySelectorAll('a') || [])].find(a => a.href === item.reviewUrl);
    compactSources(article, full, review || title, controls);
  }

  const limited = /(?:\b(?:403|404|429|5\d\d|failed|unavailable|blocked|partial)\b|失败|未能|受限|读不到|不完整|未完成|无法|超时|被拦|防火墙|需登录|未直读|未读到|播放数未|小红书未读)/i;
  function statusLabel(note) {
    const clauses = note.split(/[；;，,。！!：（()）]/);
    const affected = clauses.filter(part => limited.test(part) && !/无异常|没有失败|无失败|未发现异常/.test(part));
    if (!affected.length) return '采集说明';
    const names = new Set();
    // Only name a source when the clause containing it actually reports a limitation.
    const named = /Reddit|Product Hunt|YouTube|GitHub|Hacker News|RSS|微博|雪球|知识星球|小红书|Ridley|Dobelli|JAMA|AEA|Patreon|Substack|LessWrong/gi;
    for (const part of affected) {
      for (const match of part.matchAll(named)) names.add(match[0]);
    }
    return '部分来源受限' + (names.size ? ' · ' + [...names].join('、') : '');
  }

  function foldCorrections(col) {
    const notes = [...col.querySelectorAll(':scope > .corr')];
    if (!notes.length) return;
    const details = document.createElement('details');
    details.className = 'correction-note';
    const label = document.createElement('summary');
    label.textContent = notes.length === 1 ? '本期更正' : '本期更正（' + notes.length + ' 条）';
    notes[0].before(details);
    details.append(label, ...notes);
  }

  function foldStatus(col, note) {
    const node = col.querySelector('.status');
    if (!node || !note) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'info-toggle';
    button.textContent = 'ⓘ';
    button.title = statusLabel(note);
    button.setAttribute('aria-label', '栏目采集说明 · ' + (columnNames.get(col.dataset.slug) || col.dataset.slug));
    button.setAttribute('aria-expanded', 'false');
    node.hidden = true;
    node.id = 'collection-note-' + col.dataset.slug;
    button.setAttribute('aria-controls', node.id);
    button.addEventListener('click', () => {
      node.hidden = !node.hidden;
      button.setAttribute('aria-expanded', String(!node.hidden));
    });
    col.querySelector('.col-h').append(button);
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
      offset: anchor ? anchor.getBoundingClientRect().top - top : 0
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
  function collapseStories() {
    for (const detail of feed.querySelectorAll('.brief-detail[open]')) {
      markRead(detail.closest('.item'));
      detail.open = false;
    }
  }
  window.addEventListener('pageshow', event => {
    if (event.persisted) collapseStories();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) savePosition();
    else collapseStories();
  });

  function groupProductPicks(col, issue) {
    const section = document.createElement('section');
    section.className = 'product-picks';
    const heading = document.createElement('h3');
    heading.textContent = 'AI 产品实测';
    section.append(heading);
    let count = 0;
    for (const article of col.querySelectorAll('.item')) {
      const chip = article.querySelector('.meta .chip');
      const label = chip?.textContent.trim();
      const archived = issue.date <= '2026-11-24' && label === 'AI 产品精选 · 实际试用';
      if (!archived && !/^AI 产品(?:实测|精选)\s*·\s*独立实测$/.test(label || '')) continue;
      const bar = article.querySelector('.source-bar');
      if (!bar) continue;
      if (archived) {
        const credit = document.createElement('span');
        credit.className = 'review-credit';
        credit.textContent = 'AI News bot 试用 · 历史记录';
        bar.prepend(credit);
        chip.textContent = credit.textContent;
      } else {
        const title = article.querySelector('.brief-title').textContent;
        const item = issue.items.find(entry => entry.title === title && entry.label === label);
        const source = item?.sources?.find(entry => entry.url === (item.reviewUrl || item.url) && entry.author?.trim());
        const original = bar.querySelector('a.primary-source');
        if (!source || !original || !/^https?:$/.test(original.protocol) ||
            original.href !== new URL(source.url, location.href).href) continue;
        original.textContent = '实测：' + source.author + ' ↗';
        original.classList.add('review-credit');
        original.setAttribute('aria-label', '阅读' + source.author + '的实测原文');
        chip.textContent = '实测：' + source.author;
      }
      section.append(article);
      count++;
    }
    if (count) col.insertBefore(section, col.querySelector('.foot'));
  }

  function render() {
    observer.disconnect();
    updateFilterLabels();
    if (phone.matches) {
      filters.querySelector('[aria-pressed="true"]')?.scrollIntoView({block:'nearest', inline:'nearest'});
    }
    const all = filters.querySelector('[aria-pressed="true"]')?.dataset.slug === 'all';
    sortChildren(feed);
    for (const col of feed.children) {
      const slug = col.dataset.slug;
      const head = col.querySelector('.col-h');
      const name = head.firstElementChild;
      const count = Number(filters.querySelector('[data-slug="' + CSS.escape(slug) + '"]').dataset.count);
      const issue = latest(slug, date.value);
      const schedule = scheduleOn(slug, date.value);
      const isWeekly = weekly.has(slug) || Boolean(schedule);
      const badge = head.querySelector('.badge');
      if (schedule && badge) badge.textContent = schedule + (issue ? ' · ' + issue.date.slice(5) : '');
      const articles = Array.from(col.querySelectorAll('.item'));
      const title = document.createElement('h2');
      title.className = 'name';
      title.textContent = columnNames.get(slug) || name.textContent;
      name.replaceWith(title);
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
        if (issue?.date === date.value && issue.status) {
          const note = document.createElement('div');
          note.className = 'status';
          note.textContent = issue.status;
          col.append(note);
          foldStatus(col, issue.status);
        }
        continue;
      }
      foldStatus(col, issue?.status);
      foldCorrections(col);
      if (!issue && !all) col.querySelector('.state-missing').textContent = '待更新';
      const limit = all ? (order.slice(0, 2).includes(slug) ? 3 : 1) : articles.length;
      articles.forEach((item, index) => {
        if (index < limit) {
          const sourceItem = issue?.items.find(entry => entry.title === item.querySelector('.title')?.textContent);
          formatArticle(item, slug, issue?.date || date.value, sourceItem);
        }
        else item.remove();
      });
      if (slug === 'ai-news' && issue) groupProductPicks(col, issue);
      if (all && count) {
        col.querySelector('.foot')?.remove();
        col.append(action('查看全部 ' + count + ' 条', 'column-more', slug));
      }
    }
    restorePosition();
    observer.observe(feed, { childList: true });
  }
  const observer = new MutationObserver(render);
  render();

  const request = new URLSearchParams(location.search);
  // Follow the original shared link after the November 24 Gauth story moved to Products.
  if (request.get('date') === '2026-11-24' && request.get('col') === 'ai-news' &&
      request.get('story') === shareId('producthunt.com/products/gauth-ai-course')) {
    request.set('col', 'ai-tools');
    location.replace(location.pathname + '?' + request.toString());
    return;
  }
  if (request.has('story')) {
    const story = document.getElementById('story-' + request.get('col') + '-' + request.get('story'));
    if (story) {
      story.querySelector('.brief-detail').open = true;
      requestAnimationFrame(() => {
        story.scrollIntoView({block:'start'});
        story.querySelector('summary').focus({preventScroll:true});
      });
    } else {
      const message = document.createElement('p');
      message.className = 'empty';
      message.textContent = '这条简报已从本期移除，可继续浏览本栏。';
      feed.before(message);
      filters.addEventListener('click', () => message.remove(), {once:true});
      date.addEventListener('change', () => message.remove(), {once:true});
    }
  }
})();





