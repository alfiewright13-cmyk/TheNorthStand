// Load fixtures, clubs, and articles data
async function loadData() {
  const [fixturesRes, clubsRes, articlesRes] = await Promise.all([
    fetch('data/fixtures.json'),
    fetch('data/clubs.json'),
    fetch('data/articles.json')
  ]);
  const fixturesData = await fixturesRes.json();
  const clubsData = await clubsRes.json();
  const articlesData = await articlesRes.json();
  return {
    fixtures: fixturesData.fixtures,
    clubs: clubsData.clubs,
    articles: articlesData.articles
  };
}

function getClub(clubs, id) {
  return clubs.find(c => c.id === id);
}

function renderFixtures(fixtures, clubs) {
  const matchday1 = fixtures.filter(f => f.matchday === 1).slice(0, 6);
  const container = document.getElementById('fixture-list');

  matchday1.forEach(match => {
    const home = getClub(clubs, match.home_club_id);
    const away = getClub(clubs, match.away_club_id);
    const score = match.home_score !== null
      ? `${match.home_score} — ${match.away_score}`
      : match.kickoff;

    const item = document.createElement('div');
    item.className = 'fixture-item';
    item.innerHTML = `
      <span class="fixture-home">${home.common_name}</span>
      <span class="fixture-score">${score}</span>
      <span class="fixture-away">${away.common_name}</span>
    `;
    container.appendChild(item);
  });
}

function renderTable(clubs) {
  const tbody = document.getElementById('table-body');
  clubs.forEach((club, index) => {
    const row = document.createElement('tr');
    const position = index + 1;

    if (position <= 6) row.classList.add('championship');
    if (position >= 7) row.classList.add('relegation-group');

    row.innerHTML = `
      <td>${position}</td>
      <td>${club.common_name}</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
    `;
    tbody.appendChild(row);
  });
}

function renderArticles(articles) {
  const grid = document.getElementById('article-grid');
  if (!grid) return;

  const latest = articles.slice(0, 3);
  grid.innerHTML = latest.map(a => `
    <a href="article.html?id=${a.id}" class="article-card">
      <span class="article-tag">${a.category}</span>
      <h3>${a.title}</h3>
      <p class="article-excerpt">${a.excerpt}</p>
      <span class="article-meta">${a.author} &mdash; ${formatArticleDate(a.date)}</span>
    </a>
  `).join('');
}

function formatArticleDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

loadData().then(({ fixtures, clubs, articles }) => {
  renderFixtures(fixtures, clubs);
  renderTable(clubs);
  renderArticles(articles);
});