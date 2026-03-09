const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

function getArticleId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
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

function renderBlock(block) {
  switch (block.type) {
    case 'p':
      return `<p class="article-body-p">${block.text}</p>`;
    case 'h2':
      return `<h2 class="article-body-h2">${block.text}</h2>`;
    case 'h3':
      return `<h3 class="article-body-h3">${block.text}</h3>`;
    case 'blockquote':
      return `<blockquote class="article-body-quote">${block.text}</blockquote>`;
    default:
      return '';
  }
}

function renderArticle(article, allArticles) {
  document.title = `${article.title} — The North Stand`;

  const related = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 2);

  const main = document.getElementById('article-main');
  main.innerHTML = `

    <article class="article-container">

      <a href="articles.html" class="article-back">&larr; All articles</a>
      <span class="article-header-tag">${article.category}</span>
      <h1 class="article-header-title">${article.title}</h1>
      <p class="article-header-meta">${formatDate(article.date)} &middot; ${article.author}</p>
      <hr class="article-header-rule">

      <div class="article-body">
        ${article.body.map(renderBlock).join('')}
      </div>

    </article>

    ${related.length > 0 ? `
    <section class="article-related">
      <div class="article-related-inner">
        <h3 class="article-related-heading">More from The North Stand</h3>
        <div class="article-related-grid">
          ${related.map(a => `
            <a href="article.html?id=${a.id}" class="article-related-card">
              <span class="article-related-tag">${a.category}</span>
              <span class="article-related-title">${a.title}</span>
              <span class="article-related-date">${formatDate(a.date)}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
    ` : ''}

  `;
}

loadArticles().then(articles => {
  const id = getArticleId();
  const article = articles.find(a => a.id === id);
  if (!article) {
    document.getElementById('article-main').innerHTML = '<p style="padding:48px 24px">Article not found.</p>';
    return;
  }
  renderArticle(article, articles);
});