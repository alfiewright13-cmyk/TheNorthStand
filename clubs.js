const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

async function loadClubs() {
  const res = await fetch('data/clubs.json');
  const data = await res.json();
  return data.clubs;
}

function renderClubs(clubs) {
  const grid = document.getElementById('clubs-grid');
  grid.innerHTML = clubs.map(club => `
    <a href="club.html?id=${club.id}" class="club-card">
      <div class="club-card-colour" style="background:${club.primary_colour}"></div>
      <div class="club-card-body">
        <span class="club-card-name">${club.common_name}</span>
        <span class="club-card-city">${club.city}</span>
        <span class="club-card-meta">Est. ${club.founded} &middot; ${club.ground}</span>
      </div>
    </a>
  `).join('');
}

loadClubs().then(renderClubs);