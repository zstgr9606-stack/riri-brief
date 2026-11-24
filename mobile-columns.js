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
    'life-hacks', 'ai-tools', 'go-global', 'immigration', 'creator-watch'];
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
  const css = document.createElement('style');
  css.textContent = `
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
    .col .item.is-read .brief-title {color:var(--muted)}
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
    .brief-detail[open] + .source-bar {display:none}
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
    return parts.join(' · ') || anchor.hostname;
  }

  function compactSources(article, full, title) {
    const entries = full ? [...full.querySelectorAll('a, span')] : [];
    const links = entries.filter(node => node.tagName === 'A');
    const main = title.href ? links.find(a => a.href === title.href) || title : links[0];
    if (!main) return null;
    const primary = main.cloneNode(false);
    primary.className = 'primary-source';
    primary.textContent = (main === title ? main.hostname.replace(/^www\./, '') : shortSource(main)) + ' ↗';
    primary.setAttribute('aria-label', '打开原文：' + primary.textContent.slice(0, -2));
    const bar = document.createElement('div');
    bar.className = 'source-bar';
    bar.append(primary);
    if (main === title && !full) {
      full = document.createElement('div');
      full.className = 'xline src';
      article.append(full);
    }
    if (main === title) {
      const original = primary.cloneNode(true);
      original.textContent = primary.hostname;
      full.append(full.textContent ? '；' : '来源：', original);
    }
    const extra = new Set(entries.filter(e => e.href !== main.href).map(e => e.href || e.textContent));
    if (extra.size) {
      const more = document.createElement('button');
      more.type = 'button';
      more.textContent = '另有 ' + extra.size + ' 个来源';
      more.addEventListener('click', () => {
        const detail = article.querySelector('.brief-detail');
        detail.open = true;
        const destination = links.find(a => a.href !== main.href) || full.querySelector('a') || detail.querySelector('summary');
        destination.focus({preventScroll:true});
        full.scrollIntoView({block:'nearest'});
      });
      bar.append(more);
    }
    return bar;
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
    controls.append(link, feedback);
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
    const target = event.target.closest('a.primary-source, .src a, .brief-title, .source-bar button');
    if (!target || (event.type === 'auxclick' && (event.button !== 1 || !target.matches('a')))) return;
    if (target.matches('.brief-title') && target.parentElement.open) return;
    markRead(target.closest('.item'));
  }
  feed.addEventListener('click', recordInteraction);
  feed.addEventListener('auxclick', recordInteraction);

  function formatArticle(article, slug, issueDate) {
    const title = article.querySelector('.title');
    if (!title) return;
    article.dataset.readKey = readPrefix + issueDate + '/' + shareId(article.dataset.key || slug + '/' + title.textContent);
    refreshRead(article);
    const bar = compactSources(article, article.querySelector('.src'), title);
    article.querySelector('.sum-tg')?.remove();
    const details = document.createElement('details');
    details.className = 'brief-detail';
    const summary = document.createElement('summary');
    summary.className = 'title brief-title';
    summary.textContent = title.textContent;
    title.replaceWith(details);
    details.append(summary);
    for (const child of [...article.children]) {
      if (child !== details) details.append(child);
    }
    if (bar) article.append(bar);
    details.append(shareLink(article, summary.textContent, slug));
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
    const details = document.createElement('details');
    details.className = 'collection-status';
    const summary = document.createElement('summary');
    summary.textContent = statusLabel(note);
    details.append(summary);
    node.replaceWith(details);
    details.append(node);
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
      if (!bar || count >= 2) continue;
      if (archived) {
        const credit = document.createElement('span');
        credit.className = 'review-credit';
        credit.textContent = 'AI News bot 试用 · 历史记录';
        bar.prepend(credit);
        chip.textContent = credit.textContent;
      } else {
        const title = article.querySelector('.brief-title').textContent;
        const item = issue.items.find(entry => entry.title === title && entry.label === label);
        const source = item?.sources?.find(entry => entry.url === item.url && entry.author?.trim());
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
    for (const button of filters.querySelectorAll('button[data-slug]')) {
      const label = columnNames.get(button.dataset.slug);
      if (label) button.textContent = label;
    }
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
        if (index < limit) formatArticle(item, slug, issue?.date || date.value);
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





