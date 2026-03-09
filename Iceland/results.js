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

function getClub(clubs, id) {
  return clubs.find(c => c.id === id);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function renderMatchdayNav(completedRounds, currentRound) {
  const nav = document.getElementById('matchday-nav');
  nav.innerHTML = '';

  if (completedRounds.length === 0) {
    nav.innerHTML = '<p style="font-family: var(--font-ui); font-size: 13px; color: var(--text-muted);">No results yet — the season starts in April.</p>';
    return;
  }

  completedRounds.forEach(round => {
    const btn = document.createElement('button');
    btn.className = 'matchday-btn' + (round === currentRound ? ' active' : '');
    btn.textContent = round;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.matchday-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMatchday(window._fixtures, window._clubs, round);
    });
    nav.appendChild(btn);
  });
}

function renderMatchday(fixtures, clubs, matchday) {
  const block = document.getElementById('matchday-block');
  const matches = fixtures.filter(f => f.matchday === matchday && f.status === 'completed');

  if (matches.length === 0) {
    block.innerHTML = '<p style="font-family: var(--font-ui); font-size: 13px; color: var(--text-muted);">No results for this matchday yet.</p>';
    return;
  }

  const byDate = {};
  matches.forEach(m => {
    if (!byDate[m.date]) byDate[m.date] = [];
    byDate[m.date].push(m);
  });

  block.innerHTML = `<h2 class="matchday-title">Matchday ${matchday}</h2>`;

  Object.keys(byDate).sort().forEach(date => {
    const dateGroup = document.createElement('div');
    dateGroup.className = 'date-group';
    dateGroup.innerHTML = `<p class="date-label">${formatDate(date)}</p>`;

    byDate[date].forEach(match => {
      const home = getClub(clubs, match.home_club_id);
      const away = getClub(clubs, match.away_club_id);
      const score = `${match.home_score} — ${match.away_score}`;

      const item = document.createElement('div');
      item.className = 'fixture-row';
      item.innerHTML = `
        <span class="fixture-home">${home.common_name}</span>
        <div class="fixture-score result">${score}</div>
        <span class="fixture-away">${away.common_name}</span>
        <span class="fixture-venue">${match.venue}</span>
      `;
      dateGroup.appendChild(item);
    });

    block.appendChild(dateGroup);
  });
}

loadData().then(({ fixtures, clubs }) => {
  window._fixtures = fixtures;
  window._clubs = clubs;

  const completedRounds = [...new Set(
    fixtures
      .filter(f => f.status === 'completed')
      .map(f => f.matchday)
  )].sort((a, b) => a - b);

  if (completedRounds.length === 0) {
    renderMatchdayNav([], null);
    document.getElementById('matchday-block').innerHTML = '';
    return;
  }

  const latestRound = completedRounds[completedRounds.length - 1];
  renderMatchdayNav(completedRounds, latestRound);
  renderMatchday(fixtures, clubs, latestRound);
});