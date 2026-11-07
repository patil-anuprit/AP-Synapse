/* AP_SYNAPSE_MOBILE_RESPONSE_TABLES_V1
   Assistant response tables only; desktop presentation remains unchanged.
   Original semantic table retained; compact mobile cards generated only when safe.
*/
(() => {
  "use strict";
  const SCOPE = [
    "#assistantPage", '.assistant-page', '[data-page="assistant"]',
    '.assistant-message', '.message.assistant', '.chat-message.assistant',
    '[data-role="assistant"]', '[data-message-role="assistant"]'
  ].join(',');
  const EXCLUDE = [
    '#canvasPage', '#documentsPage', '#codeStudioPage',
    '.monaco-editor', '.cm-editor', '.spreadsheet', '.document-preview',
    '.file-preview', '[role="dialog"]', '[contenteditable="true"]',
    '.ap-table-card-list', '.ap-table-toolbar'
  ].join(',');
  const MOBILE = window.matchMedia('(max-width: 760px)');
  const mounted = new WeakSet();
  let scheduled = false;

  function eligible(table) {
    return table.isConnected && !mounted.has(table) &&
      !table.closest('.ap-premium-response-table') &&
      !table.closest(EXCLUDE) && Boolean(table.closest(SCOPE));
  }
  function text(cell) { return String(cell?.textContent || '').trim().replace(/\s+/g,' '); }
  function eligibleForCards(table) {
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    const rows = Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows));
    if (!MOBILE.matches || headers.length < 2 || headers.length > 16 ||
        rows.length < 1 || rows.length > 60 ||
        table.querySelector('[rowspan], [colspan], button, input, textarea, select, iframe, script, [contenteditable]')) return null;
    if (rows.some(r => r.cells.length !== headers.length) ||
        headers.some(h => !text(h))) return null;
    return {headers, rows};
  }
  function cleanClone(cell) {
    const destination = document.createElement('div');
    destination.className = 'ap-table-card-value';
    for (const node of cell.childNodes) destination.appendChild(node.cloneNode(true));
    destination.querySelectorAll('[id],[name],[aria-labelledby],[aria-describedby]').forEach(el => {
      el.removeAttribute('id'); el.removeAttribute('name');
      el.removeAttribute('aria-labelledby'); el.removeAttribute('aria-describedby');
    });
    return destination;
  }

  // AP_TABLE_CARDS_V2
  // AP_TABLE_NATIVE_HORIZONTAL_V4

  // AP_TABLE_MINIMAL_NATIVE_V5
  // AP_TABLE_SHORT_WITH_NOTES_V6
  // AP_TABLE_GRID_NO_STICKY_V9
  // A mobile-only non-scrolling two-column GRID, not another table.
  // This avoids sticky th/td rules inherited from the app's old table CSS.
  function makeCards(table, list, wrapper) {
    wrapper.classList.remove('ap-table-condensed', 'ap-has-table-cards');
    wrapper.querySelectorAll('.ap-table-summary, .ap-table-summary-grid, .ap-table-notes')
      .forEach(el => el.remove());
    if (list.childElementCount) list.replaceChildren();
    const scroll = wrapper.querySelector(':scope > .ap-table-scroll');
    if (!MOBILE.matches || !scroll) return;
    const headers = Array.from(table.tHead?.rows?.[0]?.cells || []);
    const rows = Array.from(table.tBodies || []).flatMap(body => Array.from(body.rows));
    const value = cell => text(cell);
    if (headers.length < 2 || headers.length > 10 || rows.length < 1 || rows.length > 28 ||
        table.querySelector('[rowspan], [colspan], table, button, input, textarea, select, iframe, script, [contenteditable]') ||
        rows.some(row => row.cells.length !== headers.length)) return;
    const transpose = headers.length > 2 &&
      /^(feature|features|criterion|criteria|aspect|attribute|metric|parameter|property)$/i
        .test(value(headers[0]));
    const comparison = /model|tool|option|platform|service|product|provider|plan|approach|method|feature|best|use|strength|limitation|advantage|disadvantage|reason|description/i
      .test(headers.map(value).join(' '));
    const long = rows.some(row => Array.from(row.cells).some(cell => value(cell).length > 78));
    if (headers.length > 2 && !transpose && !comparison && !long) return;

    const titleA = transpose ? 'Option' : value(headers[0]) || 'Item';
    const titleB = transpose ? value(rows[0].cells[0]) || 'Overview' : value(headers[1]) || 'Summary';
    const grid = document.createElement('div');
    grid.className = 'ap-table-summary-grid';
    grid.setAttribute('role', 'table');
    grid.setAttribute('aria-label', `${titleA} and ${titleB}`);
    const notes = document.createElement('div');
    notes.className = 'ap-table-notes';
    const noteHeading = document.createElement('p');
    noteHeading.className = 'ap-table-notes-title';
    noteHeading.textContent = 'Additional information';
    notes.append(noteHeading);

    function makeRow(one, two, header) {
      const row = document.createElement('div');
      row.className = 'ap-table-grid-row';
      row.setAttribute('role', 'row');
      [one, two].forEach((part, i) => {
        const cell = document.createElement('div');
        cell.className = 'ap-table-grid-cell';
        cell.setAttribute('role', header ? 'columnheader' : 'cell');
        cell.textContent = part;
        row.append(cell);
      });
      grid.append(row);
    }
    makeRow(titleA, titleB, true);

    function short(value) {
      if (value.length <= 54) return value;
      let cut = value.slice(0, 52).replace(/\s+\S*$/, '').trim();
      if (cut.length < 22) cut = value.slice(0, 52).trim();
      return cut + '…';
    }
    function add(name, headline, extras) {
      makeRow(name, short(headline), false);
      const details = [];
      if (short(headline) !== headline) details.push([titleB, headline]);
      details.push(...extras.filter(([key, val]) => key && val));
      if (!details.length) return;
      const section = document.createElement('section');
      const heading = document.createElement('h4');
      heading.textContent = name;
      section.append(heading);
      details.forEach(([key, val]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = key + ': ';
        p.append(strong, document.createTextNode(val));
        section.append(p);
      });
      notes.append(section);
    }
    if (transpose) {
      for (let col = 1; col < headers.length; col++) {
        add(value(headers[col]), value(rows[0].cells[col]),
          rows.slice(1).map(row => [value(row.cells[0]), value(row.cells[col])]));
      }
    } else {
      rows.forEach(row => add(value(row.cells[0]), value(row.cells[1]),
        headers.slice(2).map((head, i) => [value(head), value(row.cells[i + 2])])));
    }
    // Both summary and notes are SIBLINGS of the horizontal scroller.
    scroll.insertAdjacentElement('afterend', grid);
    if (notes.children.length > 1) grid.insertAdjacentElement('afterend', notes);
    wrapper.classList.add('ap-table-condensed');
  }
  function tsv(table) {
    return Array.from(table.rows).map(row =>
      Array.from(row.cells).map(cell => text(cell).replace(/\t/g,' ').replace(/\n/g,' ')).join('\t')
    ).join('\n');
  }
  function mount(table) {
    if (!eligible(table)) return;
    mounted.add(table);
    const wrap=document.createElement('section');wrap.className='ap-premium-response-table';
    wrap.setAttribute('aria-label','Response data table');
    const bar=document.createElement('div');bar.className='ap-table-toolbar';
    const caption=document.createElement('span');caption.className='ap-table-caption';
    caption.textContent='AP SYNAPSE  /  TABLE';
    const actions=document.createElement('div');actions.className='ap-table-actions';
    const hint=document.createElement('span');hint.className='ap-table-swipe-hint';
    hint.textContent='Swipe to explore';
    const copy=document.createElement('button');copy.type='button';copy.className='ap-table-copy';
    copy.textContent='Copy';copy.setAttribute('aria-label','Copy full table as text');
    copy.addEventListener('click',async()=>{
      const value=tsv(table);
      try {await navigator.clipboard.writeText(value);copy.textContent='Copied';}
      catch {copy.textContent='Copy unavailable';}
      window.setTimeout(()=>{copy.textContent='Copy';},1800);
    });
    actions.append(copy);bar.append(caption,actions);
    const scroll=document.createElement('div');scroll.className='ap-table-scroll';
    scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Scrollable response table');
    scroll.tabIndex=0;
    const cards=document.createElement('div');cards.className='ap-table-card-list';
    cards.setAttribute('role','list');cards.setAttribute('aria-label','Mobile table rows');
    table.parentNode.insertBefore(wrap, table);
    scroll.appendChild(table);wrap.append(bar,cards,scroll);
    makeCards(table,cards,wrap);
    const update = () => {
      if(!wrap.isConnected)return;
      const inCards=wrap.classList.contains('ap-has-table-cards') && MOBILE.matches;
      hint.hidden=inCards || (scroll.scrollWidth <= scroll.clientWidth+3);
    };
    window.requestAnimationFrame(update);
    let cardTimer=null;
    new MutationObserver(()=>{
      window.clearTimeout(cardTimer);
      cardTimer=window.setTimeout(()=>{if(wrap.isConnected){makeCards(table,cards,wrap);update();}},420);
    }).observe(table,{subtree:true,childList:true,characterData:true});
    if(typeof ResizeObserver==='function') new ResizeObserver(update).observe(scroll);
    if(MOBILE.addEventListener) MOBILE.addEventListener('change',()=>{makeCards(table,cards,wrap);update();});
  }
  function scan(){
    scheduled=false;
    document.querySelectorAll('table').forEach(mount);
  }
  function schedule(){
    if(scheduled)return;scheduled=true;
    window.requestAnimationFrame(scan);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();
  new MutationObserver(records => {
    if(records.every(r=>r.target?.closest?.('.ap-premium-response-table'))) return;
    schedule();
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
