
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) toggle.addEventListener('click', () => navLinks.classList.toggle('open'));

const CLUB_NAMES = {"BRE": "Breiðablik", "FH": "Hafnarfjörður", "FRA": "Fram", "IA": "Akranes", "IBV": "Vestmannaeyjar", "KA": "Akureyri", "KEF": "Keflavík", "KR": "KR Reykjavík", "STJ": "Stjarnan", "THO": "Þór", "VAL": "Valur", "VIK": "Víkingur", "AFT": "Afturelding", "FJA": "Fjallabyggð", "FJO": "Fjölnir", "FYL": "Fylkir", "GRN": "Grindavík", "GRO": "Grótta", "HAU": "Haukar", "IR": "IR Reykjavík", "KOP": "Kópavogur", "LEI": "Leiknir", "OLA": "Ólafsvík", "SEL": "Selfoss", "VES": "Vestri"};
const CURRENT_12 = new Set(["BRE", "FH", "FRA", "IA", "IBV", "KA", "KEF", "KR", "STJ", "THO", "VAL", "VIK"]);

function name(id) { return CLUB_NAMES[id] || id; }

function badge(id, size=24) {
  if (!CURRENT_12.has(id)) return '';
  return `<img src="data/badges/${id.toLowerCase()}.svg" alt="${name(id)}" class="club-badge" width="${size}" height="${size}" onerror="this.style.display='none'">`;
}

function formatDate(d) {
  const [y,m,day] = d.split('-');
  return `${parseInt(day)}.${parseInt(m)}`;
}

function buildTable(matches) {
  const table = {};
  for (const m of matches) {
    for (const id of [m.home_club_id, m.away_club_id]) {
      if (!table[id]) table[id] = {id, p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
    }
    const h = table[m.home_club_id], a = table[m.away_club_id];
    h.p++; a.p++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score)      { h.w++; h.pts+=3; a.l++; }
    else if (m.home_score < m.away_score) { a.w++; a.pts+=3; h.l++; }
    else                                  { h.d++; h.pts++; a.d++; a.pts++; }
  }
  return Object.values(table)
    .map(r => ({...r, gd: r.gf - r.ga}))
    .sort((a,b) => b.pts-a.pts || b.gd-a.gd || b.gf-a.gf);
}

function renderTable(rows, year) {
  const numClubs = rows.length;
  const isModern = numClubs >= 12;
  let html = `<table class="league-table">
    <thead><tr>
      <th class="pos">#</th><th class="club-col">Club</th>
      <th>P</th><th>W</th><th>D</th><th>L</th>
      <th class="hide-mobile">GF</th><th class="hide-mobile">GA</th>
      <th>GD</th><th>Pts</th>
    </tr></thead><tbody>`;
  rows.forEach((r,i) => {
    let cls = '';
    if (isModern) {
      if (i === 0) cls = 'championship';
      else if (i >= numClubs - 2) cls = 'relegation-group';
    }
    const gd = r.gd >= 0 ? `+${r.gd}` : r.gd;
    html += `<tr class="${cls}">
      <td class="pos">${i+1}</td>
      <td class="club-col">${badge(r.id)}
        <a href="club.html?id=${r.id}" class="club-link">${name(r.id)}</a>
      </td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td class="hide-mobile">${r.gf}</td><td class="hide-mobile">${r.ga}</td>
      <td>${gd}</td><td class="pts">${r.pts}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  return html;
}

function renderResults(matches) {
  const byRound = {};
  // Group by approximate round (every 5 per page for readability, or just all flat)
  let html = '<div class="season-results-list">';
  for (const m of [...matches].sort((a,b) => new Date(a.date)-new Date(b.date))) {
    const res = m.home_score > m.away_score ? '' : m.home_score < m.away_score ? '' : '';
    html += `<div class="season-result-row">
      <span class="sr-date">${formatDate(m.date)}</span>
      <span class="sr-home">${badge(m.home_club_id,20)}${name(m.home_club_id)}</span>
      <span class="sr-score">${m.home_score} – ${m.away_score}</span>
      <span class="sr-away">${badge(m.away_club_id,20)}${name(m.away_club_id)}</span>
    </div>`;
  }
  html += '</div>';
  return html;
}

async function init() {
  const params = new URLSearchParams(location.search);
  const year = parseInt(params.get('year'));
  if (!year) {
    document.getElementById('season-main').innerHTML = '<p class="h2h-empty">No season specified.</p>';
    return;
  }
  document.title = `${year} Season — The North Stand`;

  const res = await fetch('data/results-historical.json');
  const all = (await res.json()).matches;
  const matches = all.filter(m => m.season === year);

  if (!matches.length) {
    document.getElementById('season-main').innerHTML = '<p class="h2h-empty">No data for this season.</p>';
    return;
  }

  const table = buildTable(matches);
  const prevYear = year > 2010 ? year - 1 : null;
  const nextYear = year < 2026 ? year + 1 : null;

  const nav = `<div class="season-nav">
    ${prevYear ? `<a href="season.html?year=${prevYear}" class="season-nav-btn">← ${prevYear}</a>` : '<span></span>'}
    <a href="seasons.html" class="season-nav-index">All seasons</a>
    ${nextYear ? `<a href="season.html?year=${nextYear}" class="season-nav-btn">${nextYear} →</a>` : '<span></span>'}
  </div>`;

  document.getElementById('season-main').innerHTML = `
    <section class="page-header">
      <p class="season-label">Besta deild karla</p>
      <h1>${year} Season</h1>
    </section>
    ${nav}
    <section class="section-block">
      <h2 class="section-title">Final Table</h2>
      ${renderTable(table, year)}
    </section>
    <section class="section-block">
      <h2 class="section-title">All Results</h2>
      ${renderResults(matches)}
    </section>
    ${nav}
  `;
}

init();
