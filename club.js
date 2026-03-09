// ── SEASON HISTORY ───────────────────────────────────────────────────────────

function buildSeasonRecord(matches, clubId) {
  const byYear = {};
  for (const m of matches) {
    if (m.home_club_id !== clubId && m.away_club_id !== clubId) continue;
    if (!byYear[m.season]) byYear[m.season] = [];
    byYear[m.season].push(m);
  }
  const records = [];
  for (const [year, ms] of Object.entries(byYear)) {
    const r = {year: parseInt(year), p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
    // Build full table to get position
    const table = {};
    for (const m of ms) {
      for (const id of [m.home_club_id, m.away_club_id]) {
        if (!table[id]) table[id] = {p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
      }
      const h = table[m.home_club_id], a = table[m.away_club_id];
      h.p++; a.p++;
      h.gf += m.home_score; h.ga += m.away_score;
      a.gf += m.away_score; a.ga += m.home_score;
      if (m.home_score > m.away_score)      { h.w++; h.pts+=3; a.l++; }
      else if (m.home_score < m.away_score) { a.w++; a.pts+=3; h.l++; }
      else { h.d++; h.pts++; a.d++; a.pts++; }
    }
    // We need all season matches to get position — do via stored data
    // For now store club row from these matches only
    const cr = table[clubId] || r;
    r.p = cr.p; r.w = cr.w; r.d = cr.d; r.l = cr.l;
    r.gf = cr.gf; r.ga = cr.ga; r.pts = cr.pts;
    r.gd = r.gf - r.ga;
    records.push(r);
  }
  return records.sort((a,b) => b.year - a.year);
}

function buildFullPositions(allMatches, clubId) {
  // Group all matches by season, build full table, extract club position
  const byYear = {};
  for (const m of allMatches) {
    if (!byYear[m.season]) byYear[m.season] = [];
    byYear[m.season].push(m);
  }
  const positions = {};
  for (const [year, ms] of Object.entries(byYear)) {
    const table = {};
    for (const m of ms) {
      for (const id of [m.home_club_id, m.away_club_id]) {
        if (!table[id]) table[id] = {p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
      }
      const h = table[m.home_club_id], a = table[m.away_club_id];
      h.p++; a.p++;
      h.gf += m.home_score; h.ga += m.away_score;
      a.gf += m.away_score; a.ga += m.home_score;
      if (m.home_score > m.away_score)      { h.w++; h.pts+=3; a.l++; }
      else if (m.home_score < m.away_score) { a.w++; a.pts+=3; h.l++; }
      else { h.d++; h.pts++; a.d++; a.pts++; }
    }
    const sorted = Object.entries(table)
      .map(([id,r]) => ({id,...r,gd:r.gf-r.ga}))
      .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
    const idx = sorted.findIndex(r => r.id === clubId);
    if (idx !== -1) {
      positions[year] = { pos: idx+1, total: sorted.length, row: sorted[idx] };
    }
  }
  return positions;
}

function renderClubHistory(positions) {
  const years = Object.keys(positions).map(Number).sort((a,b) => b-a);
  if (!years.length) return '';

  let rows = '';
  for (const y of years) {
    const {pos, total, row} = positions[y];
    const gd = row.gd >= 0 ? `+${row.gd}` : row.gd;
    let posCls = pos === 1 ? 'pos-1' : pos <= 3 ? 'pos-top' : pos >= total - 1 ? 'pos-rel' : '';
    rows += `<tr>
      <td><a href="season.html?year=${y}">${y}</a></td>
      <td class="${posCls}">${pos}<span style="color:var(--text-muted);font-weight:400"> / ${total}</span></td>
      <td>${row.p}</td><td>${row.w}</td><td>${row.d}</td><td>${row.l}</td>
      <td class="hide-mobile">${row.gf}</td><td class="hide-mobile">${row.ga}</td>
      <td>${gd}</td><td class="pts">${row.pts}</td>
    </tr>`;
  }

  return `<section class="section-block" style="margin-top:48px">
    <h2 class="section-title">Season by Season</h2>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;overflow:hidden">
      <table class="club-history-table">
        <thead><tr>
          <th>Season</th><th>Pos</th>
          <th>P</th><th>W</th><th>D</th><th>L</th>
          <th class="hide-mobile">GF</th><th class="hide-mobile">GA</th>
          <th>GD</th><th>Pts</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Get club ID from URL e.g. club.html?id=FRA
function getClubId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getClub(clubs, id) {
  return clubs.find(c => c.id === id);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function calculateRecord(fixtures, clubId) {
  const record = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  fixtures
    .filter(f => f.status === 'completed' &&
      (f.home_club_id === clubId || f.away_club_id === clubId))
    .forEach(f => {
      const isHome = f.home_club_id === clubId;
      const gf = isHome ? f.home_score : f.away_score;
      const ga = isHome ? f.away_score : f.home_score;
      record.p++;
      record.gf += gf;
      record.ga += ga;
      if (gf > ga) { record.w++; record.pts += 3; }
      else if (gf === ga) { record.d++; record.pts += 1; }
      else { record.l++; }
    });
  record.gd = record.gf - record.ga;
  return record;
}

function renderClubFixtures(fixtures, clubs, clubId) {
  const clubFixtures = fixtures
    .filter(f => f.home_club_id === clubId || f.away_club_id === clubId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (clubFixtures.length === 0) return '<p class="no-data">No fixtures found.</p>';

  return clubFixtures.map(f => {
    const home = getClub(clubs, f.home_club_id);
    const away = getClub(clubs, f.away_club_id);
    const isHome = f.home_club_id === clubId;
    const hasResult = f.status === 'completed';
    const score = hasResult
      ? `${f.home_score} \u2014 ${f.away_score}`
      : f.kickoff;

    // Win/draw/loss indicator for completed matches
    let wdl = '';
    if (hasResult) {
      const gf = isHome ? f.home_score : f.away_score;
      const ga = isHome ? f.away_score : f.home_score;
      if (gf > ga) wdl = 'W';
      else if (gf === ga) wdl = 'D';
      else wdl = 'L';
    }

    const wdlColours = { W: 'var(--accent)', D: 'var(--text-muted)', L: 'var(--accent-red)' };

    return `
      <div class="club-fixture-row">
        <span class="club-fixture-date">${formatDate(f.date)}</span>
        <span class="club-fixture-venue-tag">${isHome ? 'H' : 'A'}</span>
        <span class="club-fixture-home">${home.common_name}</span>
        <div class="fixture-score${hasResult ? ' result' : ''}">${score}</div>
        <span class="club-fixture-away">${away.common_name}</span>
        ${wdl ? `<span class="club-fixture-wdl" style="color:${wdlColours[wdl]}">${wdl}</span>` : '<span></span>'}
      </div>
    `;
  }).join('');
}
const BADGE_FILES = {
  BRE: 'bre_svg.svg',
  FH:  'fh_svg.svg',
  FRA: 'fra_png.png',
  IA:  'ia_svg.svg',
  IBV: 'ibv_png.png',
  KA:  'ka_svg.svg',
  KEF: 'kef_png.png',
  KR:  'kr_svg.svg',
  STJ: 'stj_png.png',
  THO: 'tho_jpg.jpg',
  VAL: 'val_png.png',
  VIK: 'vik_svg.svg'
};

function renderPage(club, fixtures, clubs) {
  const record = calculateRecord(fixtures, club.id);

  document.title = `${club.common_name} \u2014 The North Stand`;

  const main = document.getElementById('club-main');
  main.innerHTML = `

    <section class="club-header">
      <div class="club-header-colour" style="background:${club.primary_colour}"></div>
      <div class="club-header-content">
        <p class="season-label">Besta deild karla 2026</p>
        <h1>${club.full_name}</h1>
        <p class="club-subname">${club.common_name} &mdash; ${club.city}</p>
      </div>
    </section>

    <div class="club-grid">

      <div class="club-sidebar">

        <div class="club-info-panel">
          <div class="club-panel-header">Club Info</div>
          <div class="club-info-list">
            <div class="club-info-row">
              <span class="club-info-label">Founded</span>
              <span class="club-info-value">${club.founded}</span>
            </div>
            <div class="club-info-row">
              <span class="club-info-label">City</span>
              <span class="club-info-value">${club.city}</span>
            </div>
            <div class="club-info-row">
              <span class="club-info-label">Ground</span>
              <span class="club-info-value">${club.ground}</span>
            </div>
            <div class="club-info-row">
              <span class="club-info-label">Capacity</span>
              <span class="club-info-value">${club.capacity.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="club-info-panel">
          <div class="club-panel-header">Honours</div>
          <div class="club-info-list">
            <div class="club-info-row">
              <span class="club-info-label">League titles</span>
              <span class="club-info-value">${club.honours.league}</span>
            </div>
            <div class="club-info-row">
              <span class="club-info-label">Cup titles</span>
              <span class="club-info-value">${club.honours.cup}</span>
            </div>
          </div>
        </div>

        <div class="club-info-panel">
          <div class="club-panel-header">2026 Season</div>
          <div class="club-record-grid">
            <div class="club-record-cell">
              <span class="club-record-num">${record.p}</span>
              <span class="club-record-lbl">P</span>
            </div>
            <div class="club-record-cell">
              <span class="club-record-num">${record.w}</span>
              <span class="club-record-lbl">W</span>
            </div>
            <div class="club-record-cell">
              <span class="club-record-num">${record.d}</span>
              <span class="club-record-lbl">D</span>
            </div>
            <div class="club-record-cell">
              <span class="club-record-num">${record.l}</span>
              <span class="club-record-lbl">L</span>
            </div>
            <div class="club-record-cell">
              <span class="club-record-num">${record.gd > 0 ? '+' : ''}${record.gd}</span>
              <span class="club-record-lbl">GD</span>
            </div>
            <div class="club-record-cell">
              <span class="club-record-num" style="color:var(--accent)">${record.pts}</span>
              <span class="club-record-lbl">Pts</span>
            </div>
          </div>
        </div>

      </div>

      <div class="club-fixtures-section">
        <div class="club-panel-header">Fixtures &amp; Results 2026</div>
        <div class="club-fixtures-list">
          ${renderClubFixtures(fixtures, clubs, club.id)}
        </div>
      </div>

    </div>

  `;
}

async function loadData() {
  const [fixturesRes, clubsRes, histRes] = await Promise.all([
    fetch('data/fixtures.json'),
    fetch('data/clubs.json'),
    fetch('data/results-historical.json')
  ]);
  const fixturesData = await fixturesRes.json();
  const clubsData = await clubsRes.json();
  const histData = await histRes.json();
  return {
    fixtures: fixturesData.fixtures,
    clubs: clubsData.clubs,
    historical: histData.matches
  };
}
(async () => {
  const clubId = getClubId();
  if (!clubId) return;
  const { fixtures, clubs, historical } = await loadData();
  const club = getClub(clubs, clubId);
  if (!club) return;
  renderPage(club, fixtures, clubs);
  const positions = buildFullPositions(historical, clubId);
  const historyHTML = renderClubHistory(positions);
  if (historyHTML) {
    document.getElementById('club-main').insertAdjacentHTML('beforeend', historyHTML);
  }
})();