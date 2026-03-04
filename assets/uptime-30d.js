// assets/uptime-30d.js
(async () => {
  const OWNER = 'Randomness8546';
  const REPO  = 'upptime-8546513546545641235478';

  // ---- Detect default branch (main/master) ----
  async function defaultBranch() {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, { cache: 'no-store' });
    if (r.ok) return (await r.json()).default_branch || 'master';
    // Fallbacks
    try {
      const test = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/history/summary.json`);
      if (test.ok) return 'main';
    } catch {}
    return 'master';
  }

  // ---- Load summary.json (contains dailyMinutesDown) ----
  async function loadSummary(branch) {
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${branch}/history/summary.json`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Cannot fetch ${url} (${r.status})`);
    return r.json();
  }

  // ---- 30-day window ----
  const DAYS = 30, MIN_PER_DAY = 1440;
  const today = new Date(); today.setHours(0,0,0,0);
  const iso = d => d.toISOString().slice(0,10);
  const days = [...Array(DAYS)].map((_,i)=>{ const d=new Date(today); d.setDate(d.getDate()-(DAYS-1-i)); return iso(d);});

  // ---- Granular thresholds (minutes) ----
  const L1=5, L2=60, L3=180;
  const level = m => (m<=0?'lvl0':m<=L1?'lvl1':m<=L2?'lvl2':'lvl3');

  // ---- Inject minimal CSS that relies on Upptime theme vars ----
  const css = `
  /* mimic Upptime table styling */
  table.status-table { width:100%; border-collapse: collapse; }
  table.status-table th, table.status-table td { padding: 8px 10px; border-bottom: 1px solid var(--nav-border-bottom-color, #e5e7eb); }
  table.status-table th { text-align:left; font-weight:600; }
  .u-bars { display:grid; grid-auto-flow:column; grid-auto-columns:10px; gap:3px; margin-top:4px; }
  .u-bars .cell { width:10px; height:18px; border-radius:2px; border:1px solid transparent; }
  .u-bars .lvl0 { background: color-mix(in oklab, var(--ok, #16a34a) 22%, transparent); border-color: color-mix(in oklab, var(--ok, #16a34a) 40%, transparent); }
  .u-bars .lvl1 { background: color-mix(in oklab, var(--warn, #f59e0b) 30%, transparent); border-color: color-mix(in oklab, var(--warn, #f59e0b) 50%, transparent); }
  .u-bars .lvl2 { background: color-mix(in oklab, #f97316 40%, transparent); border-color: color-mix(in oklab, #f97316 60%, transparent); }
  .u-bars .lvl3 { background: color-mix(in oklab, var(--down, #ef4444) 45%, transparent); border-color: color-mix(in oklab, var(--down, #ef4444) 65%, transparent); }
  .uptime { text-align:right; font-variant-numeric: tabular-nums; }
  .status-pill { display:inline-block; padding:2px 8px; border-radius:12px; font-size:12px; }
  .status-up   { background: var(--badge-up-bg, #d1e7dd); color:#0f5132; }
  .status-down { background: var(--badge-down-bg, #f8d7da); color:#842029; }
  `;
  const style = document.createElement('style'); style.textContent=css; document.head.appendChild(style);

  // ---- Build table skeleton ----
  const root = document.getElementById('u30-root');
  const table = document.createElement('table'); table.className='status-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>History</th>
        <th>Response</th>
        <th>Uptime (30d)</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  root.appendChild(table);
  const tbody = table.querySelector('tbody');

  // ---- Load data and render rows ----
  const branch = await defaultBranch();
  const data = await loadSummary(branch);

  const bySlug = s => String(s.slug||'').toLowerCase();
  data.forEach(svc => {
    const tr = document.createElement('tr');

    // Name
    const tdName = document.createElement('td');
    tdName.textContent = svc.name || svc.slug || '(unnamed)';

    // Status pill
    const tdStatus = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = `status-pill ${svc.status==='up'?'status-up':'status-down'}`;
    pill.textContent = svc.status==='up' ? 'Up' : 'Down';
    tdStatus.appendChild(pill);

    // History link (to YAML history in repo)
    const tdHist = document.createElement('td');
    const a = document.createElement('a');
    a.href = `https://github.com/${OWNER}/${REPO}/commits/HEAD/history/${bySlug(svc)}.yml`;
    a.textContent = `${bySlug(svc)}.yml`;
    a.target = '_blank';
    tdHist.appendChild(a);

    // Response + 30-day bars
    const tdResp = document.createElement('td');
    const strip = document.createElement('div'); strip.className='u-bars';
    days.forEach(d=>{
      const m = (svc.dailyMinutesDown && svc.dailyMinutesDown[d]) || 0;
      const cell = document.createElement('div');
      cell.className = `cell ${level(m)}`;
      cell.title = `${svc.name || bySlug(svc)}\n${d} — ${m>0 ? m+' min down' : '0 min (up)'}`;
      strip.appendChild(cell);
    });
    tdResp.appendChild(strip);

    // Uptime 30d %
    const tdUp = document.createElement('td'); tdUp.className='uptime';
    const totalMin = DAYS * MIN_PER_DAY;
    const down = days.reduce((sum,d)=> sum + ((svc.dailyMinutesDown && svc.dailyMinutesDown[d]) || 0), 0);
    const pct = Math.max(0, 100 * (1 - (down/totalMin)));
    tdUp.textContent = `${pct.toFixed(2)}%`;

    tr.appendChild(tdName);
    tr.appendChild(tdStatus);
    tr.appendChild(tdHist);
    tr.appendChild(tdResp);
    tr.appendChild(tdUp);
    tbody.appendChild(tr);
  });
})();
