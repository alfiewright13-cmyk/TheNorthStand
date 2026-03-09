const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

async function loadData() {
  const [clubsRes, historicalRes, fixturesRes] = await Promise.all([
    fetch('data/clubs.json'),
    fetch('data/results-historical.json').catch(() => ({ json: () => ({ matches: [] }) })),
    fetch('data/fixtures.json')
  ]);
  const clubs      = (await clubsRes.json()).clubs;
  const historical = (await historicalRes.json()).matches || [];
  const fixtures   = (await fixturesRes.json()).fixtures || [];

  // Combine — only completed fixtures from 2026
  const current = fixtures.filter(f => f.status === 'completed');
  const all = [...historical, ...current];

  return { clubs, matches: all };
}

function populateSelects(clubs) {
  const selA = document.getElementById('club-a');
  const selB = document.getElementById('club-b');
  clubs.forEach(c => {
    selA.innerHTML += `<option value="${c.id}">${c.common_name}</option>`;
    selB.innerHTML += `<option value="${c.id}">${c.common_name}</option>`;
  });
  // Default second select to different club
  selB.selectedIndex = 1;
}

function getH2H(matches, idA, idB) {
  return matches.filter(m =>
    m.status === 'completed' &&
    ((m.home_club_id === idA && m.away_club_id === idB) ||
     (m.home_club_id === idB && m.away_club_id === idA))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calcRecord(matches, idA, idB) {
  let wA = 0, dA = 0, lA = 0, gfA = 0, gaA = 0;
  let homeA = { w: 0, d: 0, l: 0 };
  let awayA = { w: 0, d: 0, l: 0 };

  matches.forEach(m => {
    const aIsHome = m.home_club_id === idA;
    const gf = aIsHome ? m.home_score : m.away_score;
    const ga = aIsHome ? m.away_score : m.home_score;
    gfA += gf; gaA += ga;
    const bucket = aIsHome ? homeA : awayA;
    if (gf > ga)      { wA++; bucket.w++; }
    else if (gf === ga){ dA++; bucket.d++; }
    else               { lA++; bucket.l++; }
  });

  return {
    a: { w: wA, d: dA, l: lA, gf: gfA, ga: gaA, home: homeA, away: awayA },
    b: { w: lA, d: dA, l: wA, gf: gaA, ga: gfA,
         home: { w: awayA.l, d: awayA.d, l: awayA.w },
         away: { w: homeA.l, d: homeA.d, l: homeA.w } }
  };
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function renderBar(wA, d, wB) {
  const total = wA + d + wB || 1;
  const pA = Math.round((wA / total) * 100);
  const pD = Math.round((d  / total) * 100);
  const pB = 100 - pA - pD;
  return `
    <div class="h2h-bar">
      <div class="h2h-bar-a" style="width:${pA}%"></div>
      <div class="h2h-bar-d" style="width:${pD}%"></div>
      <div class="h2h-bar-b" style="width:${pB}%"></div>
    </div>
  `;
}

function render(clubs, matches, idA, idB) {
  const clubA = clubs.find(c => c.id === idA);
  const clubB = clubs.find(c => c.id === idB);
  const h2h   = getH2H(matches, idA, idB);
  const rec   = calcRecord(h2h, idA, idB);
  const recent = h2h.slice(0, 10);

  const container = document.getElementById('h2h-results');

  if (h2h.length === 0) {
    container.innerHTML = `
      <p class="h2h-empty">No recorded meetings between ${clubA.common_name} and ${clubB.common_name}.</p>
    `;
    return;
  }

  container.innerHTML = `

    <div class="h2h-header">
      <span class="h2h-club-name">${clubA.common_name}</span>
      <span class="h2h-total-label">${h2h.length} meetings</span>
      <span class="h2h-club-name">${clubB.common_name}</span>
    </div>

    ${renderBar(rec.a.w, rec.a.d, rec.b.w)}

    <div class="h2h-record-row">
      <span class="h2h-record-num" style="color:var(--accent)">${rec.a.w}</span>
      <span class="h2h-record-lbl">Wins</span>
      <span class="h2h-record-num" style="color:var(--accent)">${rec.b.w}</span>
    </div>
    <div class="h2h-record-row">
      <span class="h2h-record-num">${rec.a.d}</span>
      <span class="h2h-record-lbl">Draws</span>
      <span class="h2h-record-num">${rec.b.d}</span>
    </div>
    <div class="h2h-record-row">
      <span class="h2h-record-num">${rec.a.gf}</span>
      <span class="h2h-record-lbl">Goals scored</span>
      <span class="h2h-record-num">${rec.b.gf}</span>
    </div>

    <div class="h2h-split-grid">
      <div class="h2h-split-panel">
        <div class="club-panel-header">${clubA.common_name} at home</div>
        <div class="h2h-split-row">
          <span>W</span><span>${rec.a.home.w}</span>
        </div>
        <div class="h2h-split-row">
          <span>D</span><span>${rec.a.home.d}</span>
        </div>
        <div class="h2h-split-row">
          <span>L</span><span>${rec.a.home.l}</span>
        </div>
      </div>
      <div class="h2h-split-panel">
        <div class="club-panel-header">${clubB.common_name} at home</div>
        <div class="h2h-split-row">
          <span>W</span><span>${rec.b.home.w}</span>
        </div>
        <div class="h2h-split-row">
          <span>D</span><span>${rec.b.home.d}</span>
        </div>
        <div class="h2h-split-row">
          <span>L</span><span>${rec.b.home.l}</span>
        </div>
      </div>
    </div>

    <div class="h2h-recent">
      <div class="club-panel-header">Recent meetings</div>
      ${recent.map(m => {
        const aIsHome = m.home_club_id === idA;
        const homeName = aIsHome ? clubA.common_name : clubB.common_name;
        const awayName = aIsHome ? clubB.common_name : clubA.common_name;
        const gfA = aIsHome ? m.home_score : m.away_score;
        const gaA = aIsHome ? m.away_score : m.home_score;
        const result = gfA > gaA ? 'W' : gfA === gaA ? 'D' : 'L';
        const resultColour = result === 'W' ? 'var(--accent)' : result === 'D' ? 'var(--text-muted)' : 'var(--accent-red)';
        return `
          <div class="h2h-match-row">
            <span class="h2h-match-date">${formatDate(m.date)}</span>
            <span class="h2h-match-season">${m.season}</span>
            <span class="h2h-match-home">${homeName}</span>
            <span class="h2h-match-score">${m.home_score} – ${m.away_score}</span>
            <span class="h2h-match-away">${awayName}</span>
            <span class="h2h-match-result" style="color:${resultColour}">${result}</span>
          </div>
        `;
      }).join('')}
    </div>

  `;
}

loadData().then(({ clubs, matches }) => {
  populateSelects(clubs);

  document.getElementById('h2h-go').addEventListener('click', () => {
    const idA = document.getElementById('club-a').value;
    const idB = document.getElementById('club-b').value;
    if (idA === idB) {
      document.getElementById('h2h-results').innerHTML =
        '<p class="h2h-empty">Please select two different clubs.</p>';
      return;
    }
    render(clubs, matches, idA, idB);
  });
});