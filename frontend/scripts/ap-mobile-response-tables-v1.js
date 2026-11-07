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
    if (!MOBILE.matches || headers.length < 2 || headers.length > 4 ||
        rows.length < 1 || rows.length > 12 ||
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
  function makeCards(table, list, wrapper) {
    const spec = eligibleForCards(table);
    if (!spec) {
      wrapper.classList.remove('ap-has-table-cards');
      list.replaceChildren();
      return;
    }
    const fragment=document.createDocumentFragment();
    spec.rows.forEach((row, index) => {
      const card=document.createElement('article');
      card.className='ap-table-card'; card.setAttribute('role','listitem');
      const title=document.createElement('div');
      title.className='ap-table-card-title';
      const indexEl=document.createElement('span');
      indexEl.className='ap-table-card-index';
      indexEl.textContent=String(index+1).padStart(2,'0');
      title.append(indexEl, cleanClone(row.cells[0]));
      card.appendChild(title);
      for(let c=1;c<row.cells.length;c++) {
        const item=document.createElement('div');item.className='ap-table-card-detail';
        const key=document.createElement('span');key.className='ap-table-card-key';
        key.textContent=text(spec.headers[c]);
        item.append(key, cleanClone(row.cells[c]));card.appendChild(item);
      }
      fragment.appendChild(card);
    });
    list.replaceChildren(fragment);
    wrapper.classList.add('ap-has-table-cards');
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
    actions.append(hint,copy);bar.append(caption,actions);
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
