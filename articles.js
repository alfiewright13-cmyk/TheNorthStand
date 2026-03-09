const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

async function loadArticles() {
  const res = await fetch('data/articles.json');
  const data = await res.json();
  return data.articles;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function renderArticles(articles) {
  const index = document.getElementById('articles-index');
  index.innerHTML = articles.map(a => `
    <a href="article.html?id=${a.id}" class="article-index-card">
      <div class="article-index-tag">${a.category}</div>
      <h2 class="article-index-title">${a.title}</h2>
      <p class="article-index-excerpt">${a.excerpt}</p>
      <span class="article-index-meta">${formatDate(a.date)} &middot; ${a.author}</span>
    </a>
  `).join('');
}

loadArticles().then(renderArticles);