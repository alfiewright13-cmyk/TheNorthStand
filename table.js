// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

async function loadData() {
  const [fixturesRes, clubsRes] = await Promise.all([
    fetch('data/fixtures.json'),
    fetch('data/clubs.json')
  ]);
  const fixturesData = await fixturesRes.json();
  const clubsData = await clubsRes.json();
  return { fixtures: fixturesData.fixtures, clubs: clubsData.clubs };
}

function calculateTable(fixtures, clubs) {
  const table = {};

  clubs.forEach(club => {
    table[club.id] = {
      id: club.id,
      name: club.common_name,
      p: 0, w: 0, d: 0, l: 0,
      gf: 0, ga: 0, gd: 0, pts: 0,
      form: []
    };
  });

  fixtures
    .filter(f => f.status === 'completed' && f.home_score !== null)
    .forEach(match => {
      const home = table[match.home_club_id];
      const away = table[match.away_club_id];
      if (!home || !away) return;

      const hg = match.home_score;
      const ag = match.away_score;

      home.p++; away.p++;
      home.gf += hg; home.ga += ag;
      away.gf += ag; away.ga += hg;

      if (hg > ag) {
        home.w++; home.pts += 3; home.form.push('W');
        away.l++; away.form.push('L');
      } else if (hg === ag) {
        home.d++; home.pts += 1; home.form.push('D');
        away.d++; away.pts += 1; away.form.push('D');
      } else {
        home.l++; home.form.push('L');
        away.w++; away.pts += 3; away.form.push('W');
      }
    });

  Object.values(table).forEach(t => {
    t.gd = t.gf - t.ga;
  });

  return Object.values(table).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
  );
}

function formDot(result) {
  const colours = { W: '#003897', D: '#9a9a90', L: '#c8102e' };
  return `<span class="form-dot" style="background:${colours[result]}" title="${result}"></span>`;
}

function renderTable(fixtures, clubs) {
  const sorted = calculateTable(fixtures, clubs);
  const tbody = document.getElementById('table-body-full');

  sorted.forEach((club, index) => {
    const position = index + 1;
    const row = document.createElement('tr');

    if (position <= 6) row.classList.add('championship');
    if (position >= 7) row.classList.add('relegation-group');
    const recentForm = club.form.slice(-5).map(formDot).join('');

    row.innerHTML = `
      <td>${position}</td>
      <td>${club.name}</td>
      <td>${club.p}</td>
      <td>${club.w}</td>
      <td>${club.d}</td>
      <td>${club.l}</td>
      <td>${club.gf}</td>
      <td>${club.ga}</td>
      <td>${club.gd > 0 ? '+' : ''}${club.gd}</td>
      <td><strong>${club.pts}</strong></td>
      <td class="form-cell">${recentForm}</td>
    `;
    tbody.appendChild(row);
  });
}

loadData().then(({ fixtures, clubs }) => {
  renderTable(fixtures, clubs);
});