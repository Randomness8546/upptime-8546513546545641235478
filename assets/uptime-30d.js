// Renders an Upptime-like table with 30-day granular bars using history/summary.json
// Uses only stable theme variables; no Sapper/Svelte client bundles needed.

(async () => {
  const OWNER = 'Randomness8546';
  const REPO  = 'upptime-8546513546545641235478';

  // ---- Helpers ----
  const DAYS = 30, MIN_PER_DAY = 1440;
  const today = new Date(); today.setHours(0,0,0,0);
  const iso = d => d.toISOString().slice(0,10);
  const lastDays = [...Array(DAYS)].map((_,i)=>{ const d=new Date(today); d.setDate(d.getDate()-(DAYS-1-i)); return iso(d); });

  const L1=5, L2=60, L3=180; // minutes
  const lvl = m => m<=0?'lvl0' : m<=L1?'lvl1' : m<=L2?'lvl2' : 'lvl3';

  async function getDefaultBranch() {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, { cache: 'no-store' });
    if (r.ok) return (await r.json()).default_branch || 'master';
    // fallback probe
    const t = await fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/history/summary.json`);
    return t.ok ? 'main' : 'master';
  }
  async function loadSummary(branch) {
    const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${branch}/history/summary.json`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`Cannot fetch ${url} (${r.status})`);
    return r.json();
  }

  // ---- Build the table shell ----
  const mount = document.getElementById('u30-root');
  const table = document.createElement('table'); table.className='status-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Naam</th>
        <th>Status</th>
        <th>Geschiedenis</th>
        <th>Dagelijkse balk (30d)</th>
        <th>Uptime (30d)</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  mount.appendChild(table);
  const tbody = table.querySelector('tbody');

  // ---- Load and render ----
  const branch = await getDefaultBranch();
  const summary = await loadSummary(branch); // contains dailyMinutesDown per service  [3](https://hashes.com/en/tools/hash_identifier)
  const slugOf = s => String(s.slug||'').toLowerCase();

  summary.forEach(svc => {
    const tr = document.createElement('tr');

    // name
    const tdName = document.createElement('td'); tdName.textContent = svc.name || slugOf(svc);

    // status
    const tdStatus = document.createElement('td');
    const pill = document.createElement('span'); pill.className = `pill ${svc.status==='up'?'up':'down'}`;
    pill.textContent = (svc.status==='up') ? 'Up' : 'Down';
    tdStatus.appendChild(pill);

    // history link
    const tdHist = document.createElement('td');
    const a = document.createElement('a');
    a.href = `https://github.com/${OWNER}/${REPO}/commits/HEAD/history/${slugOf(svc)}.yml`;
    a.target = '_blank';
    a.textContent = `${slugOf(svc)}.yml`;
    tdHist.appendChild(a);

    // bar strip
    const tdBar = document.createElement('td');
    const strip = document.createElement('div'); strip.className='u-bars';
    lastDays.forEach(d => {
      const minutes = (svc.dailyMinutesDown && svc.dailyMinutesDown[d]) || 0;
      const cell = document.createElement('div');
      cell.className = `cell ${lvl(minutes)}`;
      cell.title = `${svc.name || slugOf(svc)}\n${d} — ${minutes>0? minutes+' min down' : '0 min (up)'}`;
      strip.appendChild(cell);
    });
    tdBar.appendChild(strip);

    // uptime 30d
    const tdUptime = document.createElement('td'); tdUptime.className='uptime';
    const total = DAYS * MIN_PER_DAY;
    const down = lastDays.reduce((acc, d) => acc + ((svc.dailyMinutesDown && svc.dailyMinutesDown[d]) || 0), 0);
    tdUptime.textContent = `${Math.max(0, 100 * (1 - down/total)).toFixed(2)}%`;

    tr.append(tdName, tdStatus, tdHist, tdBar, tdUptime);
    tbody.appendChild(tr);
  });
})();
