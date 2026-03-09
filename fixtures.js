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

function renderMatchdayNav(totalRounds, currentRound) {
  const nav = document.getElementById('matchday-nav');
  nav.innerHTML = '';
  for (let i = 1; i <= totalRounds; i++) {
    const btn = document.createElement('button');
    btn.className = 'matchday-btn' + (i === currentRound ? ' active' : '');
    btn.textContent = i;
    btn.addEventListener('click', () => {
      currentRound = i;
      document.querySelectorAll('.matchday-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMatchday(window._fixtures, window._clubs, i);
    });
    nav.appendChild(btn);
  }
}

function renderMatchday(fixtures, clubs, matchday) {
  const block = document.getElementById('matchday-block');
  const matches = fixtures.filter(f => f.matchday === matchday);

  // Group by date
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
      const hasResult = match.home_score !== null;
      const scoreDisplay = hasResult
        ? `${match.home_score} — ${match.away_score}`
        : match.kickoff;

      const item = document.createElement('div');
      item.className = 'fixture-row';
      item.innerHTML = `
        <span class="fixture-home">${home.common_name}</span>
        <div class="fixture-score${hasResult ? ' result' : ''}">${scoreDisplay}</div>
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

  const totalRounds = Math.max(...fixtures.map(f => f.matchday));

  // Find the next upcoming matchday
  const today = new Date();
  const upcoming = fixtures
    .filter(f => new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const currentRound = upcoming.length > 0 ? upcoming[0].matchday : 1;

  renderMatchdayNav(totalRounds, currentRound);
  renderMatchday(fixtures, clubs, currentRound);
});